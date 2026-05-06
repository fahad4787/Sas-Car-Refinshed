import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, PlusCircle, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Resolver } from 'react-hook-form'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'

import {
  Badge,
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
} from '@/components/ui'
import { updateProductCosting, useProductCostings } from '@/features/product-costing'
import { usePurchaseOrders } from '@/features/purchase-orders'
import { useRawMaterials } from '@/features/raw-materials'
import { PageShell } from '@/pages/Dashboard/_components/PageShell'
import { Link, useRouterState } from '@tanstack/react-router'
import { formatDisplayAmount, formatTruncatedQty } from '@/lib/displayAmount'
import { zNonNegativeInput } from '@/lib/formZod'
import { todayLocalISODate } from '@/lib/localDate'
import { packUnitLabelForWeightKg } from '@/lib/weightPackUnit'

const lineSchema = z.object({
  rawMaterialId: z.string().min(1, 'Select an item'),
  qty: zNonNegativeInput,
  rate: zNonNegativeInput,
})

const schema = z.object({
  costingDate: z.string().min(1, 'Select date'),
  productName: z.string().trim().min(2, 'Product name is required'),
  weightPerPiece: zNonNegativeInput,
  production: zNonNegativeInput,
  produced: zNonNegativeInput,
  emptyTin: zNonNegativeInput,
  cartonTape: zNonNegativeInput,
  labour: zNonNegativeInput,
  lines: z.array(lineSchema).min(1, 'Add at least one raw material'),
})

type FormValues = z.infer<typeof schema>

function getIdFromPath(pathname: string) {
  const m = pathname.match(/\/dashboard\/product-costing\/([^/]+)\/edit\/?$/)
  return m?.[1] ?? ''
}

export function ProductCostingEditPage() {
  const location = useRouterState({ select: (s) => s.location })
  const productCostingId = useMemo(() => getIdFromPath(location.pathname), [location.pathname])

  const { items: rawMaterials, loading: materialsLoading } = useRawMaterials()
  const { items: purchaseOrders, loading: poLoading } = usePurchaseOrders()
  const { items: productCostings, loading: pcLoading } = useProductCostings()

  const pc = useMemo(
    () => productCostings.find((x) => x.id === productCostingId) ?? null,
    [productCostingId, productCostings],
  )

  const [saving, setSaving] = useState(false)

  const resolver = zodResolver(schema) as unknown as Resolver<FormValues>

  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      costingDate: todayLocalISODate(),
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
    if (!pc) return
    form.reset({
      costingDate: pc.costingDate || todayLocalISODate(),
      productName: pc.productName ?? '',
      weightPerPiece: Number(pc.weightPerPiece ?? 0),
      production: Number(pc.production ?? 0),
      produced: Number(pc.produced ?? 0),
      emptyTin: Number(pc.emptyTin ?? 0),
      cartonTape: Number(pc.cartonTape ?? 0),
      labour: Number(pc.labour ?? 0),
      lines:
        pc.lines?.length
          ? pc.lines.map((l) => ({
              rawMaterialId: l.rawMaterialId ?? '',
              qty: Number(l.qty ?? 0),
              rate: Number(l.rate ?? 0),
            }))
          : [{ rawMaterialId: '', qty: 0, rate: 0 }],
    })
  }, [form, pc])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  })

  const watchLines = useWatch({ control: form.control, name: 'lines' })
  const weightPerPiece = useWatch({ control: form.control, name: 'weightPerPiece' })
  const emptyTin = useWatch({ control: form.control, name: 'emptyTin' })
  const cartonTape = useWatch({ control: form.control, name: 'cartonTape' })
  const labour = useWatch({ control: form.control, name: 'labour' })

  const materialStatsById = useMemo(() => {
    const purchased = new Map<string, { qty: number; amount: number }>()
    for (const po of purchaseOrders) {
      for (const it of po.items ?? []) {
        const id = (it as { rawMaterialId?: string }).rawMaterialId ?? ''
        if (!id) continue
        const qty = Number((it as { qty?: number }).qty ?? 0)
        const amount = Number((it as { amount?: number }).amount ?? 0)
        if (!Number.isFinite(qty) || qty <= 0) continue
        const cur = purchased.get(id) ?? { qty: 0, amount: 0 }
        cur.qty += qty
        cur.amount += Number.isFinite(amount) ? amount : qty * Number((it as { rate?: number }).rate ?? 0)
        purchased.set(id, cur)
      }
    }

    const used = new Map<string, number>()
    for (const other of productCostings) {
      if (other.id === productCostingId) continue
      for (const ln of other.lines ?? []) {
        const id = (ln as { rawMaterialId?: string }).rawMaterialId ?? ''
        if (!id) continue
        const qty = Number((ln as { qty?: number }).qty ?? 0)
        if (!Number.isFinite(qty) || qty <= 0) continue
        used.set(id, (used.get(id) ?? 0) + qty)
      }
    }

    const out = new Map<string, { availableQty: number; avgRate: number }>()
    for (const [id, v] of purchased) {
      const usedQty = used.get(id) ?? 0
      out.set(id, { availableQty: Math.max(0, v.qty - usedQty), avgRate: v.qty > 0 ? v.amount / v.qty : 0 })
    }
    return out
  }, [productCostings, productCostingId, purchaseOrders])

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
    const totalQty = lines.reduce((sum, x) => sum + (Number.isFinite(x.qty) ? x.qty : 0), 0)
    const w = Number(weightPerPiece || 0)
    const productionAuto = w > 0 ? totalQty / w : 0
    const producedAuto = Math.floor(productionAuto)
    const materialCostPerPiece = producedAuto > 0 ? totalRawMaterialCost / producedAuto : 0
    const otherPerPiece =
      Number(emptyTin || 0) + Number(cartonTape || 0) + Number(labour || 0)
    const finalCostPerPiece = materialCostPerPiece + (Number.isFinite(otherPerPiece) ? otherPerPiece : 0)
    return {
      lines,
      totalQty,
      totalRawMaterialCost,
      productionAuto,
      producedAuto,
      materialCostPerPiece,
      otherPerPiece,
      finalCostPerPiece,
    }
  }, [cartonTape, emptyTin, labour, materialStatsById, rawMaterials, watchLines, weightPerPiece])

  useEffect(() => {
    form.setValue('production', computed.productionAuto, { shouldValidate: true })
    form.setValue('produced', computed.producedAuto, { shouldValidate: true })
  }, [computed.productionAuto, computed.producedAuto, form])

  function maybeApplySuggestedRate(lineIndex: number, rawMaterialId: string) {
    const suggested = materialStatsById.get(rawMaterialId)?.avgRate ?? 0
    const cur = Number(form.getValues(`lines.${lineIndex}.rate`) || 0)
    if (cur > 0) return
    if (!Number.isFinite(suggested) || suggested <= 0) return
    form.setValue(`lines.${lineIndex}.rate`, Number(suggested.toFixed(4)), { shouldValidate: true, shouldDirty: true })
  }

  async function onSubmit(values: FormValues) {
    if (!productCostingId) return
    setSaving(true)
    try {
      await updateProductCosting(productCostingId, {
        costingDate: values.costingDate,
        productName: values.productName,
        weightPerPiece: Number(values.weightPerPiece || 0),
        production: computed.productionAuto,
        produced: computed.producedAuto,
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
        totalCost: computed.finalCostPerPiece,
        costPerPiece: computed.materialCostPerPiece,
      })
      toast.success('Product updated.')
    } finally {
      setSaving(false)
    }
  }

  const loading = materialsLoading || poLoading || pcLoading

  const packUnit = packUnitLabelForWeightKg(Number(weightPerPiece || 0))
  const wKg = Number(weightPerPiece || 0)
  const productionDisplay =
    wKg > 0
      ? Number(computed.productionAuto.toFixed(5)).toString()
      : computed.totalQty > 0
        ? '—'
        : '0'

  const totalCostBatch = computed.finalCostPerPiece * computed.producedAuto

  return (
    <PageShell
      title="Edit Product"
      description="Update product details and raw materials. Totals recalculate automatically."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard/product-costing">Back to list</Link>
          </Button>
          <Button type="submit" form="pc-edit-form" disabled={!form.formState.isValid || saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      }
    >
      {!productCostingId ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-red-600">
          Invalid product.
        </div>
      ) : null}

      {!pc && productCostingId ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      <form id="pc-edit-form" className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
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
              <div className="space-y-2 md:col-span-1">
                <Label>Weight per piece (kg)</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Controller
                    control={form.control}
                    name="weightPerPiece"
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={0}
                        step="0.0001"
                        placeholder="—"
                        className="min-w-[120px] flex-1"
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const v = e.target.value
                          field.onChange(v === '' ? 0 : Number(v))
                        }}
                      />
                    )}
                  />
                  {packUnit ? (
                    <Badge variant="default" className="shrink-0">
                      {packUnit}
                    </Badge>
                  ) : Number(weightPerPiece) > 0 ? (
                    <span className="text-xs text-muted-foreground">No pack size band</span>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Production</Label>
                <Input readOnly className="bg-muted/50 tabular-nums" value={productionDisplay} />
                <p className="text-xs text-muted-foreground">Total qty ÷ weight per piece</p>
              </div>
              <div className="space-y-2">
                <Label>Produced</Label>
                <Input readOnly className="bg-muted/50 tabular-nums" value={String(computed.producedAuto)} />
                <p className="text-xs text-muted-foreground">Whole units (rounded down)</p>
              </div>
              <div className="space-y-2">
                <Label>Cost per piece</Label>
                <Input
                  readOnly
                  type="text"
                  className="bg-muted/50 tabular-nums"
                  value={formatDisplayAmount(computed.materialCostPerPiece)}
                />
                <p className="text-xs text-muted-foreground">Raw material total ÷ produced</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Raw materials</CardTitle>
              <CardDescription>Qty cannot exceed available stock.</CardDescription>
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
                                        placeholder="—"
                                        value={
                                          (field.value as unknown) === '' ||
                                          field.value === null ||
                                          field.value === undefined ||
                                          Number(field.value) === 0
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
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="w-[86px] text-right text-sm">
                                  <Badge
                                    shape="pill"
                                    variant="muted"
                                    className="ml-auto max-w-[10rem] min-w-0 justify-end truncate px-2.5"
                                    title={formatTruncatedQty(Number(line?.availableQty || 0))}
                                  >
                                    {formatTruncatedQty(Number(line?.availableQty || 0))}
                                  </Badge>
                                </TableCell>
                                <TableCell className="w-[110px]">
                                  <Controller
                                    control={form.control}
                                    name={`lines.${idx}.rate`}
                                    render={({ field }) => (
                                      <Input
                                        type="number"
                                        min={0}
                                        step="0.0001"
                                        placeholder="—"
                                        value={field.value === 0 ? '' : field.value}
                                        onChange={(e) => {
                                          const v = e.target.value
                                          field.onChange(v === '' ? 0 : Number(v))
                                        }}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatDisplayAmount(Number.isFinite(line?.amount) ? line.amount : 0)}
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
                          <TableRow className="bg-muted/40 font-semibold hover:bg-muted/40">
                            <TableCell>Total</TableCell>
                            <TableCell className="tabular-nums">{formatDisplayAmount(computed.totalQty)}</TableCell>
                            <TableCell />
                            <TableCell />
                            <TableCell className="text-right tabular-nums">
                              {formatDisplayAmount(computed.totalRawMaterialCost)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
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
                <CardDescription>Additional costs per produced unit (tin, packing, labour).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Empty tin</Label>
                    <Controller
                      control={form.control}
                      name="emptyTin"
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={0}
                          step="0.0001"
                          placeholder="—"
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => {
                            const v = e.target.value
                            field.onChange(v === '' ? 0 : Number(v))
                          }}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Carton + tape</Label>
                    <Controller
                      control={form.control}
                      name="cartonTape"
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={0}
                          step="0.0001"
                          placeholder="—"
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => {
                            const v = e.target.value
                            field.onChange(v === '' ? 0 : Number(v))
                          }}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Labour</Label>
                    <Controller
                      control={form.control}
                      name="labour"
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={0}
                          step="0.0001"
                          placeholder="—"
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => {
                            const v = e.target.value
                            field.onChange(v === '' ? 0 : Number(v))
                          }}
                        />
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-visible">
              <CardHeader className="pb-2">
                <CardTitle>Summary</CardTitle>
                <CardDescription>Updates when you change quantities or rates.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Production</div>
                      <div className="tabular-nums font-medium">{productionDisplay}</div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Produced</div>
                      <div className="tabular-nums font-medium">{computed.producedAuto}</div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Per piece (pack)</div>
                      <div className="flex flex-wrap items-center justify-end gap-2 tabular-nums font-medium">
                        {wKg > 0 ? (
                          <>
                            <span>
                              {formatDisplayAmount(wKg)} <span className="text-muted-foreground">kg</span>
                            </span>
                            {packUnit ? (
                              <Badge variant="muted">{packUnit}</Badge>
                            ) : (
                              <span className="text-xs font-normal text-muted-foreground">no band</span>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>
                    <div className="my-2 h-px bg-border" />
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Cost per piece</div>
                      <div className="tabular-nums font-medium">{formatDisplayAmount(computed.materialCostPerPiece)}</div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Tin, packing, labour</div>
                      <div className="tabular-nums font-medium">{formatDisplayAmount(computed.otherPerPiece)}</div>
                    </div>
                    <div className="my-2 h-px bg-border" />
                    <div className="flex items-center justify-between gap-x-4 gap-y-1">
                      <div className="text-base font-semibold">Total cost (per piece)</div>
                      <div className="text-base font-semibold tabular-nums">
                        {formatDisplayAmount(computed.finalCostPerPiece)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-x-4 gap-y-1">
                      <div className="text-muted-foreground">Total cost (batch)</div>
                      <div className="tabular-nums font-semibold">{formatDisplayAmount(totalCostBatch)}</div>
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

