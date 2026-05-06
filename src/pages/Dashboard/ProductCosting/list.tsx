import { useState } from 'react'

import { ConfirmDialog, DataTable } from '@/components'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { removeProductCosting, useProductCostings } from '@/features/product-costing'
import { formatDisplayAmount } from '@/lib/displayAmount'
import { packUnitLabelForWeightKg } from '@/lib/weightPackUnit'
import { PageShell } from '@/pages/Dashboard/_components/PageShell'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function ProductCostingsListPage() {
  const { items, loading, error } = useProductCostings()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  async function confirmDelete() {
    if (!deletingId) return
    setDeleteBusy(true)
    try {
      await removeProductCosting(deletingId)
      setDeletingId(null)
      toast.success('Product costing deleted.')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <PageShell
      title="Product List"
      description="Create and review product costing sheets."
      actions={
        <Button asChild>
          <Link to="/dashboard/product-costing/new">Create Product</Link>
        </Button>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>Newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            isEmpty={loading || items.length === 0}
            empty={
              loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  No product costings yet.
                </div>
              )
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))] hover:bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))]">
                  <TableHead className="text-primary-foreground">Date</TableHead>
                  <TableHead className="text-primary-foreground">Product</TableHead>
                  <TableHead className="text-primary-foreground">Items</TableHead>
                  <TableHead className="text-primary-foreground">Produced</TableHead>
                  <TableHead className="text-primary-foreground">Per piece (pack)</TableHead>
                  <TableHead className="text-right text-primary-foreground">Total cost</TableHead>
                  <TableHead className="text-right text-primary-foreground">Cost / piece</TableHead>
                  <TableHead className="w-[96px] text-right text-primary-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((pc) => {
                  const isOpen = openId === pc.id
                  const wKg = Number(pc.weightPerPiece || 0)
                  const packUnit = packUnitLabelForWeightKg(wKg)
                  const otherPerPiece =
                    Number(pc.emptyTin || 0) + Number(pc.cartonTape || 0) + Number(pc.labour || 0)
                  return (
                    <>
                      <TableRow key={pc.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {pc.costingDateLabel || pc.createdAt || '—'}
                        </TableCell>
                        <TableCell className="min-w-[260px]">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-left text-sm font-medium hover:underline"
                            onClick={() => setOpenId((cur) => (cur === pc.id ? null : pc.id))}
                          >
                            {pc.productName || '—'}
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4 opacity-60" />
                            ) : (
                              <ChevronDown className="h-4 w-4 opacity-60" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {pc.lines?.length ?? 0}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {formatDisplayAmount(Number(pc.produced || 0))}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="tabular-nums">
                              {wKg > 0 ? (
                                <>
                                  {formatDisplayAmount(wKg)} <span className="text-muted-foreground">kg</span>
                                </>
                              ) : (
                                '—'
                              )}
                            </span>
                            {wKg > 0 ? (
                              packUnit ? (
                                <Badge variant="muted">{packUnit}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">no band</span>
                              )
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatDisplayAmount(Number(pc.totalCost || 0) * Number(pc.produced || 0))}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatDisplayAmount(Number(pc.totalCost || 0))}
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
                                  to="/dashboard/product-costing/$productCostingId/edit"
                                  params={{ productCostingId: pc.id }}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link to="/dashboard/product-costing/new" search={{ from: pc.id }}>
                                  Duplicate
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-primary" onSelect={() => setDeletingId(pc.id)}>
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {isOpen ? (
                        <TableRow key={`${pc.id}-details`} className="bg-surface/40">
                          <TableCell colSpan={8} className="p-4">
                            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                              <div className="overflow-hidden rounded-2xl border border-border bg-background/70">
                                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                  <div className="text-sm font-semibold">Raw Materials</div>
                                  <div className="text-xs text-muted-foreground">{pc.lines?.length ?? 0} items</div>
                                </div>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Rate</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(pc.lines ?? []).map((ln, idx) => (
                                        <TableRow key={`${pc.id}-ln-${idx}`}>
                                          <TableCell className="min-w-[260px]">
                                            <div className="truncate text-sm font-medium">{ln.rawMaterialName || '—'}</div>
                                          </TableCell>
                                          <TableCell className="text-right tabular-nums text-sm">
                                            {formatDisplayAmount(Number(ln.qty || 0))}
                                          </TableCell>
                                          <TableCell className="text-right tabular-nums text-sm">{formatDisplayAmount(Number(ln.rate || 0))}</TableCell>
                                          <TableCell className="text-right tabular-nums text-sm font-semibold">{formatDisplayAmount(Number(ln.amount || 0))}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-border bg-background/70 p-4">
                                <div className="text-sm font-semibold">Summary</div>
                                <div className="mt-3 rounded-xl border border-border bg-surface p-3 shadow-sm">
                                  <div className="space-y-2.5 text-sm">
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="text-muted-foreground">Produced</div>
                                      <div className="tabular-nums font-medium">
                                        {formatDisplayAmount(Number(pc.produced || 0))}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="text-muted-foreground">Per piece (pack)</div>
                                      <div className="flex flex-wrap items-center justify-end gap-2 tabular-nums font-medium">
                                        {wKg > 0 ? (
                                          <>
                                            <span>
                                              {formatDisplayAmount(wKg)}{' '}
                                              <span className="text-muted-foreground">kg</span>
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
                                      <div className="tabular-nums font-medium">
                                        {formatDisplayAmount(Number(pc.totalCost || 0))}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="text-muted-foreground">Tin, packing, labour</div>
                                      <div className="tabular-nums font-medium">{formatDisplayAmount(otherPerPiece)}</div>
                                    </div>
                                    <div className="my-2 h-px bg-border" />
                                    <div className="flex items-center justify-between gap-x-4 gap-y-1">
                                      <div className="text-base font-semibold">Total cost</div>
                                      <div className="text-base font-semibold tabular-nums">
                                        {formatDisplayAmount(Number(pc.totalCost || 0) * Number(pc.produced || 0))}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-x-4 gap-y-1">
                                      <div className="text-muted-foreground">Total cost (per piece)</div>
                                      <div className="tabular-nums font-semibold">
                                        {formatDisplayAmount(Number(pc.totalCost || 0))}
                                      </div>
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
          </DataTable>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null)
        }}
        title="Delete product costing?"
        description="This will permanently delete the costing sheet."
        confirmLabel="Delete"
        confirmDanger
        busy={deleteBusy}
        onConfirm={confirmDelete}
      />
    </PageShell>
  )
}

