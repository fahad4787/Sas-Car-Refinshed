import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, PlusCircle, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Resolver } from 'react-hook-form'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DatePicker, Input, Label, SearchableSelect, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { createPurchaseOrder } from '@/features/purchase-orders'
import { useRawMaterials } from '@/features/raw-materials'
import { useSuppliers } from '@/features/suppliers'
import { PageShell } from '@/pages/Dashboard/_components/PageShell'

const itemSchema = z.object({
  rawMaterialId: z.string().min(1, 'Select an item'),
  qty: z.coerce.number().positive('Qty (Kg) is required'),
  rate: z.coerce.number().nonnegative('Rate is required'),
})

const schema = z.object({
  purchaseDate: z.string().min(1, 'Select date'),
  supplierId: z.string().min(1, 'Select supplier'),
  vatPercent: z.coerce.number().min(0).max(100),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
})

type FormValues = z.infer<typeof schema>

export function PurchaseOrderPage() {
  const { items: suppliers, loading: suppliersLoading } = useSuppliers()
  const { items: rawMaterials, loading: materialsLoading } = useRawMaterials()
  const [saving, setSaving] = useState(false)

  const resolver = zodResolver(schema) as unknown as Resolver<FormValues>

  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      purchaseDate: new Date().toISOString().slice(0, 10),
      supplierId: '',
      vatPercent: 0,
      items: [{ rawMaterialId: '', qty: 1, rate: 0 }],
    },
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const watchItems = useWatch({ control: form.control, name: 'items' })
  const vatPercent = useWatch({ control: form.control, name: 'vatPercent' })
  const supplierId = useWatch({ control: form.control, name: 'supplierId' })
  const purchaseDate = useWatch({ control: form.control, name: 'purchaseDate' })

  const supplier = useMemo(
    () => suppliers.find((s) => s.id === supplierId) ?? null,
    [supplierId, suppliers],
  )

  const money = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  )

  const computed = useMemo(() => {
    const items = (watchItems ?? []).map((it) => {
      const qty = Number(it.qty || 0)
      const rate = Number(it.rate || 0)
      const amount = qty * rate
      const rm = rawMaterials.find((r) => r.id === it.rawMaterialId)
      return {
        rawMaterialId: it.rawMaterialId,
        rawMaterialName: rm?.name ?? '',
        qty,
        rate,
        amount,
      }
    })

    const totalAmount = items.reduce((sum, x) => sum + (Number.isFinite(x.amount) ? x.amount : 0), 0)
    const vatAmount = totalAmount * (Number(vatPercent || 0) / 100)
    const grossAmount = totalAmount + vatAmount
    return { items, totalAmount, vatAmount, grossAmount }
  }, [rawMaterials, vatPercent, watchItems])

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      await createPurchaseOrder({
        purchaseDate: values.purchaseDate,
        supplierId: values.supplierId,
        supplierName: supplier ? `${supplier.customerCode} — ${supplier.companyName}` : '',
        vatPercent: Number(values.vatPercent || 0),
        items: computed.items.map((x) => ({
          rawMaterialId: x.rawMaterialId,
          rawMaterialName: x.rawMaterialName,
          qty: x.qty,
          rate: x.rate,
          amount: x.amount,
        })),
        totalAmount: computed.totalAmount,
        vatAmount: computed.vatAmount,
        grossAmount: computed.grossAmount,
      })

      form.reset({
        purchaseDate: new Date().toISOString().slice(0, 10),
        supplierId: '',
        vatPercent: 0,
        items: [{ rawMaterialId: '', qty: 1, rate: 0 }],
      })
      toast.success('Purchase order saved.')
    } finally {
      setSaving(false)
    }
  }

  const loading = suppliersLoading || materialsLoading

  return (
    <PageShell
      title="Purchase Order"
      description="Add multiple items with qty and rate in one screen. Amounts and totals are calculated automatically."
      actions={
        <Button
          type="submit"
          form="po-form"
          disabled={!form.formState.isValid || saving || loading}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save Purchase Order'
          )}
        </Button>
      }
    >
      <form id="po-form" className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Choose purchase date, supplier, and VAT.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Purchase Date</Label>
                <Controller
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={(next) => field.onChange(next)} />
                  )}
                />
                {form.formState.errors.purchaseDate?.message ? (
                  <div className="text-sm text-red-400">{form.formState.errors.purchaseDate.message}</div>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Supplier</Label>
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Controller
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value}
                        onChange={(next) => field.onChange(next)}
                        options={suppliers.map((s) => ({
                          value: s.id,
                          label: s.customerCode
                            ? `${s.customerCode} — ${s.companyName}${s.contact ? ` (${s.contact})` : ''}`
                            : `${s.companyName}${s.contact ? ` (${s.contact})` : ''}`,
                        }))}
                        placeholder="Select supplier"
                        searchPlaceholder="Search supplier…"
                        emptyText="No suppliers found"
                      />
                    )}
                  />
                )}
                {form.formState.errors.supplierId?.message ? (
                  <div className="text-sm text-red-400">
                    {form.formState.errors.supplierId.message}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label>VAT %</Label>
                <Input type="number" min={0} max={100} step="0.01" {...form.register('vatPercent')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>Qty and rate per raw material. Amount is auto.</CardDescription>
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
                            <TableHead className="text-primary-foreground">Unit</TableHead>
                          <TableHead className="text-primary-foreground">Rate</TableHead>
                          <TableHead className="text-right text-primary-foreground">Amount</TableHead>
                          <TableHead className="w-[64px] text-right text-primary-foreground" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((f, idx) => {
                          const line = computed.items[idx]
                          return (
                            <TableRow key={f.id}>
                              <TableCell className="min-w-[260px]">
                                <Controller
                                  control={form.control}
                                  name={`items.${idx}.rawMaterialId`}
                                  render={({ field }) => (
                                    <SearchableSelect
                                      value={field.value}
                                      onChange={(next) => field.onChange(next)}
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
                                {form.formState.errors.items?.[idx]?.rawMaterialId?.message ? (
                                  <div className="mt-1 text-sm text-red-400">
                                    {form.formState.errors.items[idx]?.rawMaterialId?.message}
                                  </div>
                                ) : null}
                              </TableCell>
                              <TableCell className="min-w-[130px]">
                                <Input type="number" min={0} step="0.01" {...form.register(`items.${idx}.qty`)} />
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">
                                {rawMaterials.find((r) => r.id === computed.items[idx]?.rawMaterialId)?.unit || '—'}
                              </TableCell>
                              <TableCell className="min-w-[160px]">
                                <Input type="number" min={0} step="0.01" {...form.register(`items.${idx}.rate`)} />
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ rawMaterialId: '', qty: 1, rate: 0 })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add another item
                  </Button>
                </div>
              </>
            )}
          </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Live totals based on items and VAT.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-border bg-[linear-gradient(180deg,hsl(0_0%_100%/0.04),hsl(0_0%_100%/0))] p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-muted-foreground">Items</div>
                    <div className="tabular-nums font-medium">{computed.items.length}</div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-muted-foreground">Subtotal</div>
                    <div className="tabular-nums font-semibold">{money.format(computed.totalAmount)}</div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-muted-foreground">VAT ({Number(vatPercent || 0)}%)</div>
                    <div className="tabular-nums font-semibold">{money.format(computed.vatAmount)}</div>
                  </div>
                  <div className="mt-3 h-px bg-border" />
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-base font-semibold">Gross</div>
                    <div className="tabular-nums text-base font-semibold">{money.format(computed.grossAmount)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </PageShell>
  )
}

