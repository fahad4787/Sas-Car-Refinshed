import type { ProductCostingDoc } from '@/features/product-costing/types'

export type ProductCosting = Omit<ProductCostingDoc, 'createdAt'> & {
  id: string
  createdAt: string
  createdAtDate: Date | null
  costingDateLabel: string
}

