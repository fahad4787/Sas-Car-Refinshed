import type { PurchaseOrderDoc } from '@/features/purchase-orders/types'

export type PurchaseOrder = Omit<PurchaseOrderDoc, 'createdAt'> & {
  id: string
  createdAt: string
  createdAtDate: Date | null
  purchaseDateDate: Date | null
  purchaseDateLabel: string
}

