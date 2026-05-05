import { useEffect, useMemo, useState } from 'react'

import { subscribePurchaseOrders } from '@/features/purchase-orders/repo'
import type { PurchaseOrder } from './viewTypes'

export function usePurchaseOrders() {
  const [items, setItems] = useState<PurchaseOrder[]>([])
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
    const unsub = subscribePurchaseOrders(
      (rows) => {
        const next: PurchaseOrder[] = rows.map(({ id, data }) => {
          const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : null
          const purchaseDateStr = (data as unknown as { purchaseDate?: string }).purchaseDate ?? ''
          const purchaseDateDate =
            purchaseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(purchaseDateStr)
              ? new Date(`${purchaseDateStr}T00:00:00`)
              : null
          const purchaseDateLabel = purchaseDateDate
            ? dateFmt.format(purchaseDateDate)
            : createdAtDate
              ? dateFmt.format(createdAtDate)
              : ''
          return {
            id,
            purchaseDate: purchaseDateStr,
            supplierId: data.supplierId ?? '',
            supplierName: data.supplierName ?? '',
            vatPercent: Number(data.vatPercent ?? 0),
            items: Array.isArray(data.items) ? data.items : [],
            totalAmount: Number(data.totalAmount ?? 0),
            vatAmount: Number(data.vatAmount ?? 0),
            grossAmount: Number(data.grossAmount ?? 0),
            createdAtDate,
            createdAt: createdAtDate ? dateFmt.format(createdAtDate) : '',
            purchaseDateDate,
            purchaseDateLabel,
          }
        })
        setItems(next)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setLoading(false)
        setError(err.message || 'Failed to load purchase orders')
      },
    )

    return () => unsub()
  }, [])

  const latest = useMemo(() => items[0] ?? null, [items])
  return { items, latest, loading, error }
}

