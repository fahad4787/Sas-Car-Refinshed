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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import type { Customer } from '@/features/customers'
import { createCustomer, removeCustomer, updateCustomer, useCustomers } from '@/features/customers'
import { PageShell } from '@/pages/Dashboard/_components/PageShell'

const schema = z.object({
  name: z.string().trim().min(2, 'Customer name is required'),
  phone: z.string().trim().min(7, 'Phone number is required'),
  email: z.string().trim().email('Valid email is required'),
})

type FormValues = z.infer<typeof schema>

export function CustomerPage() {
  const { items, latest, loading, error } = useCustomers()
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [upsertOpen, setUpsertOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '' },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!upsertOpen) return
    form.reset({
      name: editing?.name ?? '',
      phone: editing?.phone ?? '',
      email: editing?.email ?? '',
    })
  }, [editing, form, upsertOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((x) => {
      const hay = `${x.name} ${x.phone} ${x.email}`.toLowerCase()
      return hay.includes(q)
    })
  }, [items, query])

  async function onSubmit(data: FormValues) {
    setSaving(true)
    try {
      if (editing) {
        await updateCustomer(editing.id, { name: data.name, phone: data.phone, email: data.email })
      } else {
        await createCustomer({ name: data.name, phone: data.phone, email: data.email })
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
      await removeCustomer(deleting.id)
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <PageShell
      title="Customer Define"
      description="Create customers to use in POS and customer ledger."
      actions={
        <Button
          type="button"
          onClick={() => {
            setEditing(null)
            setUpsertOpen(true)
          }}
        >
          Add Customer
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
                <div className="text-xs text-muted-foreground">Total customers</div>
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
                  {loading ? <Skeleton className="h-5 w-40" /> : latest ? latest.name : '—'}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {loading ? (
                    <Skeleton className="mt-1 h-4 w-52" />
                  ) : latest ? (
                    latest.createdAt || 'Just now'
                  ) : (
                    'No customers added yet'
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
                    placeholder="Search customers"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
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
                    {items.length === 0 ? 'No customers yet' : 'No matches'}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {items.length === 0 ? 'Add your first customer to start POS.' : 'Try a different search.'}
                  </div>
                </div>
              )
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))] hover:bg-[linear-gradient(180deg,hsl(0_72%_46%/1),hsl(0_72%_46%/0.88))]">
                  <TableHead className="text-primary-foreground">Name</TableHead>
                  <TableHead className="text-primary-foreground">Phone</TableHead>
                  <TableHead className="text-primary-foreground">Email</TableHead>
                  <TableHead className="w-[88px] text-right text-primary-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="min-w-0">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{c.name}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">Added {c.createdAt}</div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0 truncate text-sm text-foreground/90">{c.phone || '—'}</TableCell>
                    <TableCell className="min-w-0 truncate text-sm text-foreground/90">{c.email || '—'}</TableCell>
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
                              setEditing(c)
                              setUpsertOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-primary" onSelect={() => setDeleting(c)}>
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
            <DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            <DialogDescription>Customer will be used in POS and ledger.</DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer name</Label>
                  <Input id="customer-name" placeholder="e.g. Ali" autoComplete="name" {...form.register('name')} />
                  {form.formState.errors.name?.message ? (
                    <div className="text-sm text-red-400">{form.formState.errors.name.message}</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Phone number</Label>
                  <Input
                    id="customer-phone"
                    placeholder="e.g. 0300xxxxxxx"
                    autoComplete="tel"
                    {...form.register('phone')}
                  />
                  {form.formState.errors.phone?.message ? (
                    <div className="text-sm text-red-400">{form.formState.errors.phone.message}</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    placeholder="e.g. name@example.com"
                    autoComplete="email"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email?.message ? (
                    <div className="text-sm text-red-400">{form.formState.errors.email.message}</div>
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
                  'Add Customer'
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
        title="Delete customer?"
        description={deleting ? `This will permanently delete “${deleting.name}”.` : undefined}
        confirmLabel="Delete"
        confirmDanger
        busy={deleteBusy}
        onConfirm={confirmDelete}
      />
    </PageShell>
  )
}

