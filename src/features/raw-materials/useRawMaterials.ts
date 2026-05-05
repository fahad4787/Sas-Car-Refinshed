import { useEffect, useMemo, useState } from 'react'

import { subscribeRawMaterials } from '@/features/raw-materials/repo'
import type { RawMaterial } from '@/features/raw-materials/types'

export function useRawMaterials() {
  const [items, setItems] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribeRawMaterials(
      (rows) => {
        const next: RawMaterial[] = rows.map(({ id, data }) => ({
          id,
          name: data.name ?? '',
          description: data.description ?? '',
          unit: data.unit ?? '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : '',
        }))
        setItems(next)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setLoading(false)
        setError(err.message || 'Failed to load raw materials')
      },
    )

    return () => unsub()
  }, [])

  const latest = useMemo(() => items[0], [items])
  return { items, latest, loading, error }
}

