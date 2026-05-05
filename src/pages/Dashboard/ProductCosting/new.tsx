import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, PlusCircle, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Resolver } from 'react-hook-form'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DatePicker,
  Input,
  Label,
  SearchableSelect,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@/components/ui'
import { usePurchaseOrders } from '@/features/purchase-orders'
import { createProductCosting, useProductCostings } from '@/features/product-costing'
import { useRawMaterials } from '@/features/raw-materials'
import { PageShell } from '@/pages/Dashboard/_components/PageShell'
import { useRouterState } from '@tanstack/react-router'

const lineSchema = z.object({
  rawMaterialId: z.string().min(1, 'Select an item'),
  qty: z.coerce.number().nonnegative('Qty is required'),
  rate: z.coerce.number().nonnegative('Rate is required'),
})

const schema = z.object({
  costingDate: z.string().min(1, 'Select date'),
  productName: z.string().trim().min(2, 'Product name is required'),
  weightPerPiece: z.coerce.number().nonnegative(),
  production: z.coerce.number().nonnegative(),
  produced: z.coerce.number().nonnegative(),
  emptyTin: z.coerce.number().nonnegative(),
  cartonTape: z.coerce.number().nonnegative(),
  labour: z.coerce.number().nonnegative(),
  lines: z.array(lineSchema).min(1, 'Add at least one raw material'),
})

type FormValues = z.infer<typeof schema>

export function ProductCostingNewPage() {
  const location = useRouterState({ select: (s) => s.location })
  const { items: rawMaterials, loading: materialsLoading } = useRawMaterials()
  const { items: purchaseOrders, loading: poLoading } = usePurchaseOrders()
  const { items: productCostings } = useProductCostings()
  const [saving, setSaving] = useState(false)

  const resolver = zodResolver(schema) as unknown as Resolver<FormValues>

  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      costingDate: new Date().toISOString().slice(0, 10),
      productName: '',
      weightPerPiece: 0,
      production: 0,
      produced: 0,
      emptyTin: 0,
      cartonTape: 0,
      labour: 0,
      lines: [{ rawMaterialId: '', qty: 0, rate: 0 }],
    },
    mode: 'onChange',
  })

  useEffect(() => {
    const fromId = new URLSearchParams(location.search ?? '').get('from') ?? ''
    if (!fromId) return
    const src = productCostings.find((x) => x.id === fromId)
    if (!src) return
    form.reset({
      costingDate: new Date().toISOString().slice(0, 10),
      productName: src.productName ?? '',
      weightPerPiece: Number(src.weightPerPiece ?? 0),
      production: Number(src.production ?? 0),
      produced: Number(src.produced ?? 0),
      emptyTin: Number(src.emptyTin ?? 0),
      cartonTape: Number(src.cartonTape ?? 0),
      labour: Number(src.labour ?? 0),
      lines:
        src.lines?.length
          ? src.lines.map((l) => ({
              rawMaterialId: l.rawMaterialId ?? '',
              qty: Number(l.qty ?? 0),
              rate: Number(l.rate ?? 0),
            }))
          : [{ rawMaterialId: '', qty: 0, rate: 0 }],
    })
  }, [form, location.search, productCostings])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  })

  const watchLines = useWatch({ control: form.control, name: 'lines' })
  const costingDate = useWatch({ control: form.control, name: 'costingDate' })
  const weightPerPiece = useWatch({ control: form.control, name: 'weightPerPiece' })
  const production = useWatch({ control: form.control, name: 'production' })
  const produced = useWatch({ control: form.control, name: 'produced' })
  const emptyTin = useWatch({ control: form.control, name: 'emptyTin' })
  const cartonTape = useWatch({ control: form.control, name: 'cartonTape' })
  const labour = useWatch({ control: form.control, name: 'labour' })

  const money = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  )

  const materialStatsById = useMemo(() => {
    const map = new Map<string, { qty: number; amount: number }>()
    for (const po of purchaseOrders) {
      for (const it of po.items ?? []) {
        const id = (it as { rawMaterialId?: string }).rawMaterialId ?? ''
        if (!id) continue
        const qty = Number((it as { qty?: number }).qty ?? 0)
        const amount = Number((it as { amount?: number }).amount ?? 0)
        if (!Number.isFinite(qty) || qty <= 0) continue
        const cur = map.get(id) ?? { qty: 0, amount: 0 }
        cur.qty += qty
        cur.amount += Number.isFinite(amount) ? amount : qty * Number((it as { rate?: number }).rate ?? 0)
        map.set(id, cur)
      }
    }

    const out = new Map<string, { availableQty: number; avgRate: number }>()
    for (const [id, v] of map) {
      out.set(id, { availableQty: v.qty, avgRate: v.qty > 0 ? v.amount / v.qty : 0 })
    }
    return out
  }, [purchaseOrders])

  const computed = useMemo(() => {
    const lines = (watchLines ?? []).map((ln) => {
      const qty = Number(ln.qty || 0)
      const rate = Number(ln.rate || 0)
      const amount = qty * rate
      const rm = rawMaterials.find((r) => r.id === ln.rawMaterialId)
      const stats = materialStatsById.get(ln.rawMaterialId) ?? { availableQty: 0, avgRate: 0 }
      return {
        rawMaterialId: ln.rawMaterialId,
        rawMaterialName: rm?.name ?? '',
        qty,
        rate,
        amount,
        availableQty: stats.availableQty,
        suggestedRate: stats.avgRate,
      }
    })

    const totalRawMaterialCost = lines.reduce((sum, x) => sum + (Number.isFinite(x.amount) ? x.amount : 0), 0)
    const other =
      Number(emptyTin || 0) +
      Number(cartonTape || 0) +
      Number(labour || 0)
    const totalCost = totalRawMaterialCost + (Number.isFinite(other) ? other : 0)
    const pieces = Number(produced || production || 0)
    const costPerPiece = pieces > 0 ? totalCost / pieces : 0
    return { lines, totalRawMaterialCost, totalCost, costPerPiece }
  }, [
    materialStatsById,
    cartonTape,
    emptyTin,
    labour,
    production,
    produced,
    rawMaterials,
    watchLines,
  ])

  function maybeApplySuggestedRate(lineIndex: number, rawMaterialId: string) {
    const suggested = materialStatsById.get(rawMaterialId)?.avgRate ?? 0
    const cur = Number(form.getValues(`lines.${lineIndex}.rate`) || 0)
    if (cur > 0) return
    if (!Number.isFinite(suggested) || suggested <= 0) return
    form.setValue(`lines.${lineIndex}.rate`, Number(suggested.toFixed(4)), { shouldValidate: true, shouldDirty: true })
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      await createProductCosting({
        costingDate: values.costingDate,
        productName: values.productName,
        weightPerPiece: Number(values.weightPerPiece || 0),
        production: Number(values.production || 0),
        produced: Number(values.produced || 0),
        emptyTin: Number(values.emptyTin || 0),
        cartonTape: Number(values.cartonTape || 0),
        labour: Number(values.labour || 0),
        lines: computed.lines.map((x) => ({
          rawMaterialId: x.rawMaterialId,
          rawMaterialName: x.rawMaterialName,
          qty: x.qty,
          rate: x.rate,
          amount: x.amount,
        })),
        totalRawMaterialCost: computed.totalRawMaterialCost,
        totalCost: computed.totalCost,
        costPerPiece: computed.costPerPiece,
      })

      form.reset({
        costingDate: new Date().toISOString().slice(0, 10),
        productName: '',
        weightPerPiece: 0,
        production: 0,
        produced: 0,
        emptyTin: 0,
        cartonTape: 0,
        labour: 0,
        lines: [{ rawMaterialId: '', qty: 0, rate: 0 }],
      })
      toast.success('Product costing saved.')
    } finally {
      setSaving(false)
    }
  }

  const loading = materialsLoading || poLoading

  return (
    <PageShell
      title="Create Product"
      description="Select raw materials, enter qty, and use the suggested average rate (editable). Totals recalculate automatically."
      actions={
        <Button type="submit" form="pc-form" disabled={!form.formState.isValid || saving || loading}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save Product'
          )}
        </Button>
      }
    >
      <form id="pc-form" className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Product details</CardTitle>
            <CardDescription>Date, name, and production details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Controller
                  control={form.control}
                  name="costingDate"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={(next) => field.onChange(next)} />
                  )}
                />
                {form.formState.errors.costingDate?.message ? (
                  <div className="text-sm text-red-400">{form.formState.errors.costingDate.message}</div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Product name</Label>
                <Input placeholder="e.g. SAS 513B Silver" {...form.register('productName')} />
                {form.formState.errors.productName?.message ? (
                  <div className="text-sm text-red-400">{form.formState.errors.productName.message}</div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Weight per piece</Label>
                <Input type="number" min={0} step="0.0001" {...form.register('weightPerPiece')} />
              </div>
              <div className="space-y-2">
                <Label>Production</Label>
                <Input type="number" min={0} step="1" {...form.register('production')} />
              </div>
              <div className="space-y-2">
                <Label>Produced</Label>
                <Input type="number" min={0} step="1" {...form.register('produced')} />
              </div>
              <div className="hidden md:block" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Raw materials</CardTitle>
              <CardDescription>Average rate is suggested from purchase orders.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))] hover:bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))]">
                            <TableHead className="text-primary-foreground">Item</TableHead>
                            <TableHead className="text-primary-foreground">Qty</TableHead>
                            <TableHead className="text-right text-primary-foreground">Avail</TableHead>
                            <TableHead className="text-primary-foreground">Rate</TableHead>
                            <TableHead className="text-right text-primary-foreground">Amount</TableHead>
                            <TableHead className="w-[64px] text-right text-primary-foreground" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((f, idx) => {
                            const line = computed.lines[idx]
                            return (
                              <TableRow key={f.id}>
                                <TableCell className="min-w-[220px]">
                                  <Controller
                                    control={form.control}
                                    name={`lines.${idx}.rawMaterialId`}
                                    render={({ field }) => (
                                      <SearchableSelect
                                        value={field.value}
                                        onChange={(next) => {
                                          field.onChange(next)
                                          maybeApplySuggestedRate(idx, next)
                                        }}
                                        options={rawMaterials.map((rm) => ({
                                          value: rm.id,
                                          label: rm.unit ? `${rm.name} (${rm.unit})` : rm.name,
                                        }))}
                                        placeholder="Select item"
                                        searchPlaceholder="Search item…"
                                        emptyText="No items found"
                                      />
                                    )}
                                  />
                                  {form.formState.errors.lines?.[idx]?.rawMaterialId?.message ? (
                                    <div className="mt-1 text-sm text-red-400">
                                      {form.formState.errors.lines[idx]?.rawMaterialId?.message}
                                    </div>
                                  ) : null}
                                </TableCell>
                                <TableCell className="w-[96px]">
                                  <Controller
                                    control={form.control}
                                    name={`lines.${idx}.qty`}
                                    render={({ field }) => (
                                      <Input
                                        type="number"
                                        min={0}
                                        max={Number(line?.availableQty || 0)}
                                        step="0.0001"
                                        value={
                                          (field.value as unknown) === '' || field.value === null || field.value === undefined
                                            ? ''
                                            : field.value
                                        }
                                        onChange={(e) => {
                                          if (e.target.value === '') {
                                            field.onChange('')
                                            return
                                          }

                                          const next = Number(e.target.value)
                                          const cap = Number(line?.availableQty || 0)
                                          const clamped = Math.max(0, Math.min(Number.isFinite(cap) ? cap : 0, Number.isFinite(next) ? next : 0))
                                          field.onChange(clamped)
                                        }}
                                        onBlur={() => {
                                          if ((field.value as unknown) === '') field.onChange(0)
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="w-[86px] text-right text-sm">
                                  <Badge shape="circle" variant="muted" className="ml-auto">
                                    {Number(line?.availableQty || 0)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="w-[110px]">
                                  <Input type="number" min={0} step="0.0001" {...form.register(`lines.${idx}.rate`)} />
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {money.format(Number.isFinite(line?.amount) ? line.amount : 0)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => remove(idx)}
                                    disabled={fields.length === 1}
                                    aria-label="Remove line"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={() => append({ rawMaterialId: '', qty: 0, rate: 0 })}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add another item
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Other costs</CardTitle>
                <CardDescription>Additional per-batch costs.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Empty tin</Label>
                    <Input type="number" min={0} step="0.0001" {...form.register('emptyTin')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Carton + tape</Label>
                    <Input type="number" min={0} step="0.0001" {...form.register('cartonTape')} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Labour</Label>
                    <Input type="number" min={0} step="0.0001" {...form.register('labour')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>Live totals based on lines and other costs.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-border bg-[linear-gradient(180deg,hsl(0_0%_100%/0.04),hsl(0_0%_100%/0))] p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Weight per piece</div>
                      <div className="tabular-nums font-medium">{Number(weightPerPiece || 0)}</div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Date</div>
                      <div className="tabular-nums font-medium">{costingDate || '—'}</div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Production</div>
                      <div className="tabular-nums font-medium">{Number(production || 0)}</div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Produced</div>
                      <div className="tabular-nums font-medium">{Number(produced || 0)}</div>
                    </div>
                    <div className="my-2 h-px bg-border" />
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Raw material cost</div>
                      <div className="tabular-nums font-semibold">{money.format(computed.totalRawMaterialCost)}</div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Other costs</div>
                      <div className="tabular-nums font-semibold">
                        {money.format(Number(emptyTin || 0) + Number(cartonTape || 0) + Number(labour || 0))}
                      </div>
                    </div>
                    <div className="mt-3 h-px bg-border" />
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-base font-semibold">Total cost</div>
                      <div className="tabular-nums text-base font-semibold">{money.format(computed.totalCost)}</div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Cost per piece</div>
                      <div className="tabular-nums font-semibold">{money.format(computed.costPerPiece)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </PageShell>
  )
}

