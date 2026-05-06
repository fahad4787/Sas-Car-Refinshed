import { useMemo, useState } from 'react'

import { DataTable } from '@/components'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  SearchableSelect,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { useProductCostings } from '@/features/product-costing'
import { formatTruncatedQty } from '@/lib/displayAmount'
import { packUnitLabelForWeightKg } from '@/lib/weightPackUnit'
import { PageShell } from '@/pages/Dashboard/_components/PageShell'
import { Barrel, Boxes, Droplet, Package } from 'lucide-react'
import { GiWaterGallon } from 'react-icons/gi'

function iconForPackUnit(unit: string) {
  const u = unit.trim().toLowerCase()
  if (u === 'drum') return Barrel
  if (u === 'ltr' || u === 'liter' || u === 'litre') return Droplet
  if (u === 'pcs' || u === 'piece' || u === 'pieces') return Package
  if (u === 'gallon') return GiWaterGallon
  return Package
}

type UnitFilter = 'all' | 'drum' | 'ltr' | 'pcs' | 'gallon' | 'other'

function normalizeUnit(u: string): UnitFilter {
  const v = (u || '').trim().toLowerCase()
  if (v === 'drum') return 'drum'
  if (v === 'ltr' || v === 'liter' || v === 'litre') return 'ltr'
  if (v === 'pcs' || v === 'piece' || v === 'pieces') return 'pcs'
  if (v === 'gallon') return 'gallon'
  if (!v) return 'other'
  return 'other'
}

export function StockReportPage() {
  const { items, loading, error } = useProductCostings()
  const [query, setQuery] = useState('')
  const [unitFilter, setUnitFilter] = useState<UnitFilter>('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const source = items.filter((x) => {
      if (q && !`${x.productName}`.toLowerCase().includes(q)) return false
      const wKg = Number(x.weightPerPiece ?? 0)
      const packUnit = packUnitLabelForWeightKg(wKg)
      const unit = normalizeUnit(packUnit)
      if (unitFilter !== 'all' && unit !== unitFilter) return false
      return true
    })

    const mapped = source.map((pc) => {
      const wKg = Number(pc.weightPerPiece ?? 0)
      const packUnit = packUnitLabelForWeightKg(wKg)
      const Icon = iconForPackUnit(packUnit || '')
      const inStock = Number(pc.produced ?? 0)
      return {
        id: pc.id,
        productName: pc.productName ?? '',
        packUnit,
        packUnitKind: normalizeUnit(packUnit),
        weightPerPieceKg: wKg,
        inStock,
        createdAt: pc.createdAt || '',
        costingDateLabel: pc.costingDateLabel || '',
        Icon,
      }
    })

    mapped.sort((a, b) => {
      const an = (a.productName || '').toLowerCase()
      const bn = (b.productName || '').toLowerCase()
      return an.localeCompare(bn)
    })

    return mapped
  }, [items, query, unitFilter])

  const stockTierById = useMemo(() => {
    const values = rows
      .map((r) => (Number.isFinite(r.inStock) ? Number(r.inStock) : 0))
      .filter((x) => Number.isFinite(x))
      .sort((a, b) => a - b)

    const p33 = values.length ? values[Math.floor(values.length * 0.33)] ?? 0 : 0
    const p66 = values.length ? values[Math.floor(values.length * 0.66)] ?? 0 : 0

    const tier = new Map<string, 'low' | 'normal' | 'high'>()
    for (const r of rows) {
      const v = Number.isFinite(r.inStock) ? Number(r.inStock) : 0
      if (v <= p33) tier.set(r.id, 'low')
      else if (v >= p66) tier.set(r.id, 'high')
      else tier.set(r.id, 'normal')
    }
    return { tier, p33, p66 }
  }, [rows])

  return (
    <PageShell
      title="Stock Report"
      description="Current stock based on produced quantities."
    >
      {error ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border bg-surface-2 p-3">
                <Boxes className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total items</div>
                <div className="mt-1 text-2xl font-semibold">
                  {loading ? <Skeleton className="h-7 w-14" /> : items.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardContent className="pt-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {loading ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : (
                <>
                  <SearchableSelect
                    value={unitFilter}
                    onChange={(next) => setUnitFilter((next as UnitFilter) || 'all')}
                    options={[
                      { value: 'all', label: 'All packs' },
                      { value: 'drum', label: 'Drum' },
                      { value: 'ltr', label: 'Ltr' },
                      { value: 'gallon', label: 'Gallon' },
                      { value: 'pcs', label: 'Pcs' },
                      { value: 'other', label: 'Other' },
                    ]}
                    placeholder="All packs"
                    searchPlaceholder="Search pack…"
                    emptyText="No packs found"
                  />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product" />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Filter by pack type and search by name.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            isEmpty={loading || rows.length === 0}
            empty={
              loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">No products found.</div>
              )
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))] hover:bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))]">
                  <TableHead className="text-primary-foreground">Date</TableHead>
                  <TableHead className="text-primary-foreground">Product</TableHead>
                  <TableHead className="text-primary-foreground">Pack</TableHead>
                  <TableHead className="text-primary-foreground">Weight</TableHead>
                  <TableHead className="text-right text-primary-foreground">In stock</TableHead>
                  <TableHead className="text-right text-primary-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const stock = Number.isFinite(r.inStock) ? r.inStock : 0
                  const tier = stockTierById.tier.get(r.id) ?? 'normal'
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {r.costingDateLabel || r.createdAt || '—'}
                      </TableCell>
                      <TableCell className="min-w-0">
                        <div className="truncate text-sm font-medium">{r.productName || '—'}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-2">
                            <r.Icon className="h-4 w-4 text-primary" />
                          </div>
                          {r.packUnit ? (
                            <Badge variant="muted">{r.packUnit}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {r.weightPerPieceKg > 0 ? `${formatTruncatedQty(r.weightPerPieceKg)} kg` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          shape="pill"
                          variant="muted"
                          className="ml-auto max-w-40 min-w-0 justify-end truncate px-2.5 tabular-nums"
                          title={formatTruncatedQty(stock)}
                        >
                          {formatTruncatedQty(stock)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          shape="pill"
                          variant="muted"
                          className={[
                            'tabular-nums',
                            tier === 'low'
                              ? 'border border-red-200 bg-red-50 text-red-700'
                              : tier === 'high'
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border border-border bg-surface-2 text-foreground/80',
                          ].join(' ')}
                          title={`Based on this list: low ≤ ${formatTruncatedQty(stockTierById.p33)}, high ≥ ${formatTruncatedQty(stockTierById.p66)}`}
                        >
                          {tier === 'low' ? 'Low' : tier === 'high' ? 'High' : 'Normal'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </DataTable>
        </CardContent>
      </Card>
    </PageShell>
  )
}
