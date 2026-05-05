import type { Timestamp } from 'firebase/firestore'

export type ProductCostingLine = {
  rawMaterialId: string
  rawMaterialName: string
  qty: number
  rate: number
  amount: number
}

export type ProductCostingDoc = {
  costingDate: string
  productName: string
  weightPerPiece: number
  production: number
  produced: number
  emptyTin: number
  cartonTape: number
  labour: number
  lines: ProductCostingLine[]
  totalRawMaterialCost: number
  totalCost: number
  costPerPiece: number
  createdAt: Timestamp | null
}

