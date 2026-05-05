import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Resolver } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ConfirmDialog, DataTable } from '@/components'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  Skeleton,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@/components/ui'
import type { RawMaterial } from '@/features/raw-materials'
import {
  createRawMaterial,
  removeRawMaterial,
  updateRawMaterial,
  useRawMaterials,
} from '@/features/raw-materials'
import { usePurchaseOrders } from '@/features/purchase-orders'
import { PageShell } from '@/pages/Dashboard/_components/PageShell'

const schema = z.object({
  name: z.string().trim().min(2, 'Item name is required'),
  unit: z.string().trim().min(1, 'Select unit'),
  description: z.string().trim().default(''),
})

type FormValues = z.infer<typeof schema>

export function RawMaterialPage() {
  const { items, latest, loading, error } = useRawMaterials()
  const { items: purchaseOrders, loading: poLoading } = usePurchaseOrders()
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [upsertOpen, setUpsertOpen] = useState(false)
  const [editing, setEditing] = useState<RawMaterial | null>(null)
  const [deleting, setDeleting] = useState<RawMaterial | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const resolver = zodResolver(schema) as unknown as Resolver<FormValues>

  const form = useForm<FormValues>({
    resolver,
    defaultValues: { name: '', unit: 'Kg', description: '' },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!upsertOpen) return
    form.reset({
      name: editing?.name ?? '',
      unit: editing?.unit ?? 'Kg',
      description: editing?.description ?? '',
    })
  }, [editing, form, upsertOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((x) => {
      const hay = `${x.name} ${x.description}`.toLowerCase()
      return hay.includes(q)
    })
  }, [items, query])

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

  const money = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  )

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      if (editing) {
        await updateRawMaterial(editing.id, {
          name: values.name,
          unit: values.unit,
          description: values.description ?? '',
        })
      } else {
        await createRawMaterial({
          name: values.name,
          unit: values.unit,
          description: values.description ?? '',
        })
      }
      setUpsertOpen(false)
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await removeRawMaterial(deleting.id)
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <PageShell
      title="Raw Material Definition"
      description="Define raw material items to use in purchase orders and costing."
      actions={
        <Button
          type="button"
          onClick={() => {
            setEditing(null)
            setUpsertOpen(true)
          }}
        >
          Add Raw Material
        </Button>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total items</div>
            <div className="mt-2 text-2xl font-semibold">
              {loading ? <Skeleton className="h-7 w-14" /> : items.length}
            </div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Latest</div>
                <div className="mt-1 text-sm font-semibold">
                  {loading ? <Skeleton className="h-5 w-52" /> : latest ? latest.name : '—'}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {loading ? (
                    <Skeleton className="mt-1 h-4 w-60" />
                  ) : latest ? (
                    latest.createdAt || 'Just now'
                  ) : (
                    'No items added yet'
                  )}
                </div>
              </div>
              <div className="w-full sm:max-w-sm">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Raw materials</CardTitle>
          <CardDescription>Use these items in purchase orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            isEmpty={loading || poLoading || filtered.length === 0}
            empty={
              loading || poLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  No items found.
                </div>
              )
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))] hover:bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))]">
                  <TableHead className="text-primary-foreground">Item Name</TableHead>
                  <TableHead className="text-primary-foreground">Unit</TableHead>
                  <TableHead className="text-primary-foreground">Description</TableHead>
                  <TableHead className="text-right text-primary-foreground">Available</TableHead>
                  <TableHead className="text-right text-primary-foreground">Avg rate</TableHead>
                  <TableHead className="w-[88px] text-right text-primary-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((rm) => (
                  <TableRow key={rm.id}>
                    <TableCell className="min-w-0">
                      <div className="truncate text-sm font-medium">{rm.name}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        Added {rm.createdAt}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {rm.unit || '—'}
                    </TableCell>
                    <TableCell className="min-w-0 truncate text-sm text-foreground/90">
                      {rm.description || '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <Badge shape="circle" variant="muted" className="ml-auto">
                        {Number(materialStatsById.get(rm.id)?.availableQty ?? 0)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {materialStatsById.get(rm.id)?.avgRate
                        ? money.format(materialStatsById.get(rm.id)?.avgRate ?? 0)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditing(rm)
                              setUpsertOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-primary" onSelect={() => setDeleting(rm)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
        </CardContent>
      </Card>

      <Dialog
        open={upsertOpen}
        onOpenChange={(open) => {
          if (saving) return
          setUpsertOpen(open)
          if (!open) setEditing(null)
        }}
      >
        <DialogContent disableClose={saving}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Raw Material' : 'Add Raw Material'}</DialogTitle>
            <DialogDescription>Used in purchase orders and product costing.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rm-name">Item name</Label>
                  <Input id="rm-name" placeholder="e.g. Primer" {...form.register('name')} />
                  {form.formState.errors.name?.message ? (
                    <div className="text-sm text-red-400">{form.formState.errors.name.message}</div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select {...form.register('unit')}>
                    <option value="Kg">Kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Gram">Gram</option>
                    <option value="Mtn">Mtn</option>
                    <option value="Box">Box</option>
                    <option value="Nos">Nos</option>
                  </Select>
                  {form.formState.errors.unit?.message ? (
                    <div className="text-sm text-red-400">{form.formState.errors.unit.message}</div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rm-desc">Description</Label>
                  <Textarea id="rm-desc" placeholder="Optional details…" {...form.register('description')} />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUpsertOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!form.formState.isValid || saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : editing ? (
                  'Save changes'
                ) : (
                  'Add Raw Material'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title="Delete raw material?"
        description={deleting ? `This will permanently delete “${deleting.name}”.` : undefined}
        confirmLabel="Delete"
        confirmDanger
        busy={deleteBusy}
        onConfirm={confirmDelete}
      />
    </PageShell>
  )
}

