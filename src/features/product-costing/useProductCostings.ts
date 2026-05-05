import { useEffect, useMemo, useState } from 'react'

import { subscribeProductCostings } from '@/features/product-costing/repo'
import type { ProductCosting } from '@/features/product-costing/viewTypes'

export function useProductCostings() {
  const [items, setItems] = useState<ProductCosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    [],
  )

  useEffect(() => {
    const unsub = subscribeProductCostings(
      (rows) => {
        const next: ProductCosting[] = rows.map(({ id, data }) => {
          const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : null
          const costingDateStr = (data as unknown as { costingDate?: string }).costingDate ?? ''
          const costingDateDate =
            costingDateStr && /^\d{4}-\d{2}-\d{2}$/.test(costingDateStr)
              ? new Date(`${costingDateStr}T00:00:00`)
              : null
          return {
            id,
            costingDate: costingDateStr,
            productName: data.productName ?? '',
            weightPerPiece: Number(data.weightPerPiece ?? 0),
            production: Number(data.production ?? 0),
            produced: Number(data.produced ?? 0),
            emptyTin: Number(data.emptyTin ?? 0),
            cartonTape: Number(data.cartonTape ?? 0),
            labour: Number(data.labour ?? 0),
            lines: Array.isArray(data.lines) ? data.lines : [],
            totalRawMaterialCost: Number(data.totalRawMaterialCost ?? 0),
            totalCost: Number(data.totalCost ?? 0),
            costPerPiece: Number(data.costPerPiece ?? 0),
            createdAtDate,
            createdAt: createdAtDate ? dateFmt.format(createdAtDate) : '',
            costingDateLabel: costingDateDate
              ? dateFmt.format(costingDateDate)
              : createdAtDate
                ? dateFmt.format(createdAtDate)
                : '',
          }
        })
        setItems(next)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setLoading(false)
        setError(err.message || 'Failed to load product costings')
      },
    )

    return () => unsub()
  }, [])

  const latest = useMemo(() => items[0] ?? null, [items])
  return { items, latest, loading, error }
}

