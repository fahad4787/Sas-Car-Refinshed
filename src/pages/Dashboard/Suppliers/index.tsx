import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MoreVertical, Pencil, Search, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import type { Supplier } from '@/features/suppliers'
import { createSupplier, removeSupplier, updateSupplier, useSuppliers } from '@/features/suppliers'
import { PageShell } from '@/pages/Dashboard/_components/PageShell'

const supplierSchema = z.object({
  customerCode: z.string().trim().min(1, 'Customer code is required'),
  companyName: z.string().trim().min(2, 'Company name is required'),
  contact: z.string().trim().min(3, 'Contact is required'),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

export function SupplierPage() {
  const { items, latest, loading, error } = useSuppliers()
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [upsertOpen, setUpsertOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState<Supplier | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { customerCode: '', companyName: '', contact: '' },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!upsertOpen) return
    form.reset({
      customerCode: editing?.customerCode ?? '',
      companyName: editing?.companyName ?? '',
      contact: editing?.contact ?? '',
    })
  }, [editing, form, upsertOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((x) => {
      const hay = `${x.customerCode} ${x.companyName} ${x.contact}`.toLowerCase()
      return hay.includes(q)
    })
  }, [items, query])

  async function onSubmit(data: SupplierFormValues) {
    setSaving(true)
    try {
      if (editing) {
        await updateSupplier(editing.id, {
          customerCode: data.customerCode,
          companyName: data.companyName,
          contact: data.contact,
        })
      } else {
        await createSupplier({
          customerCode: data.customerCode,
          companyName: data.companyName,
          contact: data.contact,
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
      await removeSupplier(deleting.id)
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <PageShell
      title="Supplier Definition"
      description="Create suppliers to use in purchase orders and costing."
      actions={
        <Button
          type="button"
          onClick={() => {
            setEditing(null)
            setUpsertOpen(true)
          }}
        >
          Add Supplier
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
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border bg-surface-2 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total suppliers</div>
                <div className="mt-1 text-2xl font-semibold">
                  {loading ? <Skeleton className="h-7 w-14" /> : items.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Latest</div>
                <div className="mt-1 text-sm font-semibold">
                  {loading ? <Skeleton className="h-5 w-40" /> : latest ? latest.companyName : '—'}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {loading ? (
                    <Skeleton className="mt-1 h-4 w-52" />
                  ) : latest ? (
                    latest.createdAt || 'Just now'
                  ) : (
                    'No suppliers added yet'
                  )}
                </div>
              </div>
              <div className="w-full sm:max-w-sm">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                    placeholder="Search suppliers"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
          <CardDescription>Recently added appear on top.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            isEmpty={loading || filtered.length === 0}
            empty={
              loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-2">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-4 text-sm font-semibold">
                    {items.length === 0 ? 'No suppliers yet' : 'No matches'}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {items.length === 0
                      ? 'Add your first supplier to start purchase orders.'
                      : 'Try a different search.'}
                  </div>
                </div>
              )
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))] hover:bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))]">
                  <TableHead className="text-primary-foreground">Customer Code</TableHead>
                  <TableHead className="text-primary-foreground">Company Name</TableHead>
                  <TableHead className="text-primary-foreground">Contact</TableHead>
                  <TableHead className="w-[88px] text-right text-primary-foreground">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="min-w-0">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{s.customerCode}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          Added {s.createdAt}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0 truncate text-sm text-foreground/90">
                      {s.companyName}
                    </TableCell>
                    <TableCell className="min-w-0 truncate text-sm text-foreground/90">
                      {s.contact || '—'}
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
                              setEditing(s)
                              setUpsertOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-primary"
                            onSelect={() => setDeleting(s)}
                          >
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
            <DialogTitle>{editing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
            <DialogDescription>
              Customer code and company name will be used in purchase orders.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-code">Customer Code</Label>
                <Input
                  id="supplier-code"
                  placeholder="e.g. CUST-001"
                  autoComplete="off"
                  {...form.register('customerCode')}
                />
                {form.formState.errors.customerCode?.message ? (
                  <div className="text-sm text-red-400">
                    {form.formState.errors.customerCode.message}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-company">Company Name</Label>
                <Input
                  id="supplier-company"
                  placeholder="e.g. ABC Traders"
                  autoComplete="organization"
                  {...form.register('companyName')}
                />
                {form.formState.errors.companyName?.message ? (
                  <div className="text-sm text-red-400">
                    {form.formState.errors.companyName.message}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-contact">Contact</Label>
                <Input
                  id="supplier-contact"
                  placeholder="Phone, email, or person name"
                  autoComplete="tel"
                  {...form.register('contact')}
                />
                {form.formState.errors.contact?.message ? (
                  <div className="text-sm text-red-400">
                    {form.formState.errors.contact.message}
                  </div>
                ) : null}
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
                  'Add Supplier'
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
        title="Delete supplier?"
        description={
          deleting
            ? `This will permanently delete “${deleting.companyName || deleting.customerCode}”.`
            : undefined
        }
        confirmLabel="Delete"
        confirmDanger
        busy={deleteBusy}
        onConfirm={confirmDelete}
      />
    </PageShell>
  )
}

