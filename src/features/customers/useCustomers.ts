import { useEffect, useMemo, useState } from 'react'

import { subscribeCustomers } from '@/features/customers/repo'
import type { Customer } from '@/features/customers/types'

export function useCustomers() {
  const [items, setItems] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribeCustomers(
      (rows) => {
        const next: Customer[] = rows.map(({ id, data }) => ({
          id,
          name: data.name ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : '',
        }))
        setItems(next)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setLoading(false)
        const msg = err.message || 'Failed to load customers'
        setError(
          msg.includes('Missing or insufficient permissions')
            ? 'Missing or insufficient permissions. Update Firestore rules to allow access to the “customers” collection (same as “suppliers”).'
            : msg,
        )
      },
    )

    return () => unsub()
  }, [])

  const latest = useMemo(() => items[0], [items])
  return { items, latest, loading, error }
}

