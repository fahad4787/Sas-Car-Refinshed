import { useMemo, useState } from 'react'

import { ConfirmDialog, DataTable } from '@/components'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DateRangePicker, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, SearchableSelect, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import type { DateRange } from '@/components/ui/date-range-picker'
import { removePurchaseOrder, usePurchaseOrders } from '@/features/purchase-orders'
import { useRawMaterials } from '@/features/raw-materials'
import { formatDisplayAmount } from '@/lib/displayAmount'
import { PageShell } from '@/pages/Dashboard/_components/PageShell'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSuppliers } from '@/features/suppliers'

function displaySupplierName(value: string) {
  const v = (value ?? '').trim()
  if (!v) return '—'
  const parts = v.split('—').map((x) => x.trim()).filter(Boolean)
  return parts.length >= 2 ? parts.slice(1).join(' — ') : v
}

export function PurchaseOrdersListPage() {
  const { items, loading, error } = usePurchaseOrders()
  const { items: suppliers, loading: suppliersLoading } = useSuppliers()
  const { items: rawMaterials, loading: materialsLoading } = useRawMaterials()
  const [range, setRange] = useState<DateRange>({ from: null, to: null })
  const [supplierId, setSupplierId] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const unitByMaterialId = useMemo(() => {
    const map = new Map<string, string>()
    for (const rm of rawMaterials) map.set(rm.id, rm.unit || '')
    return map
  }, [rawMaterials])

  const filtered = useMemo(() => {
    const from = range.from ? new Date(range.from) : null
    const to = range.to ? new Date(range.to) : null
    if (from) from.setHours(0, 0, 0, 0)
    if (to) to.setHours(23, 59, 59, 999)

    return items.filter((po) => {
      if (supplierId && po.supplierId !== supplierId) return false
      const d = po.purchaseDateDate ?? po.createdAtDate
      if (!d) return true
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    })
  }, [items, range.from, range.to, supplierId])

  async function confirmDelete() {
    if (!deletingId) return
    setDeleteBusy(true)
    try {
      await removePurchaseOrder(deletingId)
      if (openId === deletingId) setOpenId(null)
      setDeletingId(null)
      toast.success('Purchase order deleted.')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <PageShell
      title="Purchase Orders"
      description="Browse and filter purchase orders by date range."
      actions={
        <Button asChild>
          <Link to="/dashboard/purchase-orders/new">New Purchase Order</Link>
        </Button>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>All purchase orders</CardTitle>
            <CardDescription>Newest first. Use filters on the right.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              isEmpty={loading || materialsLoading || filtered.length === 0}
              empty={
                loading || materialsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    No purchase orders found for this date range.
                  </div>
                )
              }
            >
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))] hover:bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))]">
                        <TableHead className="text-primary-foreground">Date</TableHead>
                        <TableHead className="text-primary-foreground">Supplier</TableHead>
                        <TableHead className="text-primary-foreground">Items</TableHead>
                        <TableHead className="text-right text-primary-foreground">Gross</TableHead>
                        <TableHead className="w-[110px] text-right text-primary-foreground">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((po) => {
                        const isOpen = openId === po.id
                        return (
                          <>
                            <TableRow key={po.id}>
                              <TableCell className="whitespace-nowrap text-sm">
                                {po.purchaseDateLabel || po.createdAt || '—'}
                              </TableCell>
                              <TableCell className="min-w-[260px]">
                                <div className="truncate text-sm font-medium">
                                  {displaySupplierName(po.supplierName)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                  onClick={() => setOpenId((cur) => (cur === po.id ? null : po.id))}
                                >
                                  <span className="tabular-nums">{po.items?.length ?? 0}</span>
                                  <span className="text-xs">items</span>
                                  {isOpen ? (
                                    <ChevronUp className="h-4 w-4 opacity-70" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 opacity-70" />
                                  )}
                                </button>
                              </TableCell>
                              <TableCell className="text-right tabular-nums font-semibold">
                                {formatDisplayAmount(po.grossAmount || 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-9 w-9">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link
                                        to="/dashboard/purchase-orders/$purchaseOrderId/edit"
                                        params={{ purchaseOrderId: po.id }}
                                      >
                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                        Edit
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-primary" onSelect={() => setDeletingId(po.id)}>
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>

                            {isOpen ? (
                              <TableRow key={`${po.id}-details`} className="bg-surface/40">
                                <TableCell colSpan={5} className="p-4">
                                  <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                                    <div className="overflow-hidden rounded-2xl border border-border bg-background/70">
                                      <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                        <div className="text-sm font-semibold">Purchased items</div>
                                        <div className="text-xs text-muted-foreground">
                                          {po.items?.length ?? 0} lines
                                        </div>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <Table>
                                          <TableHeader>
                                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                              <TableHead>Item</TableHead>
                                              <TableHead className="text-right">Qty</TableHead>
                                              <TableHead className="text-right">Unit</TableHead>
                                              <TableHead className="text-right">Rate</TableHead>
                                              <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {(po.items ?? []).map((it, idx) => (
                                              <TableRow key={`${po.id}-it-${idx}`}>
                                                <TableCell className="min-w-[260px]">
                                                  <div className="truncate text-sm font-medium">
                                                    {it.rawMaterialName || '—'}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-sm">
                                                  {formatDisplayAmount(Number(it.qty || 0))}
                                                </TableCell>
                                                <TableCell className="text-right text-sm">
                                                  {unitByMaterialId.get((it as { rawMaterialId?: string }).rawMaterialId ?? '') || '—'}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-sm">
                                                  {formatDisplayAmount(Number(it.rate || 0))}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-sm font-semibold">
                                                  {formatDisplayAmount(Number(it.amount || 0))}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>

                                    <div className="rounded-2xl border border-border bg-background/70 p-4">
                                      <div className="text-sm font-semibold">Summary</div>
                                      <div className="mt-3 space-y-2 text-sm">
                                        <div className="flex items-center justify-between gap-4">
                                          <div className="text-muted-foreground">Subtotal</div>
                                          <div className="tabular-nums font-semibold">
                                            {formatDisplayAmount(po.totalAmount || 0)}
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                          <div className="text-muted-foreground">VAT ({Number(po.vatPercent || 0)}%)</div>
                                          <div className="tabular-nums font-semibold">
                                            {formatDisplayAmount(po.vatAmount || 0)}
                                          </div>
                                        </div>
                                        <div className="my-2 h-px bg-border" />
                                        <div className="flex items-center justify-between gap-4">
                                          <div className="text-base font-semibold">Gross</div>
                                          <div className="tabular-nums text-base font-semibold">
                                            {formatDisplayAmount(po.grossAmount || 0)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DataTable>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Date range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DateRangePicker value={range} onChange={setRange} />

            <div className="space-y-2">
              <div className="text-sm font-medium">Supplier</div>
              {suppliersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <SearchableSelect
                  value={supplierId}
                  onChange={(next) => setSupplierId(next)}
                  options={[
                    { value: '', label: 'All suppliers' },
                    ...suppliers.map((s) => ({ value: s.id, label: s.companyName })),
                  ]}
                  placeholder="All suppliers"
                  searchPlaceholder="Search supplier…"
                  emptyText="No suppliers found"
                />
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface/50 p-4">
              <div className="text-xs text-muted-foreground">Showing</div>
              <div className="mt-1 text-2xl font-semibold">{filtered.length}</div>
              <div className="mt-1 text-sm text-muted-foreground">purchase orders</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null)
        }}
        title="Delete purchase order?"
        description="This will permanently delete the purchase order and its items."
        confirmLabel="Delete"
        confirmDanger
        busy={deleteBusy}
        onConfirm={confirmDelete}
      />
    </PageShell>
  )
}

