import type { Timestamp } from 'firebase/firestore'

export type PurchaseOrderItem = {
  rawMaterialId: string
  rawMaterialName: string
  qty: number
  rate: number
  amount: number
}

export type PurchaseOrderDoc = {
  purchaseDate: string
  supplierId: string
  supplierName: string
  vatPercent: number
  items: PurchaseOrderItem[]
  totalAmount: number
  vatAmount: number
  grossAmount: number
  createdAt: Timestamp | null
}

