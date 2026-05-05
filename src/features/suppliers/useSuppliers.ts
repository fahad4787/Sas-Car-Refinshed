import { useEffect, useMemo, useState } from 'react'

import { subscribeSuppliers } from '@/features/suppliers/repo'
import type { Supplier } from '@/features/suppliers/types'

export function useSuppliers() {
  const [items, setItems] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribeSuppliers(
      (rows) => {
        const next: Supplier[] = rows.map(({ id, data }) => ({
          id,
          customerCode: data.customerCode ?? '',
          companyName: data.companyName ?? data.name ?? '',
          contact: data.contact ?? '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : '',
        }))
        setItems(next)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setLoading(false)
        setError(err.message || 'Failed to load suppliers')
      },
    )

    return () => unsub()
  }, [])

  const latest = useMemo(() => items[0], [items])

  return { items, latest, loading, error }
}

