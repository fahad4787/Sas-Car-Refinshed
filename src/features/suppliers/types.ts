import type { Timestamp } from 'firebase/firestore'

export type SupplierDoc = {
  customerCode?: string
  companyName?: string
  contact?: string
  // Backward compat (older docs)
  name?: string
  createdAt: Timestamp | null
}

export type Supplier = {
  id: string
  customerCode: string
  companyName: string
  contact: string
  createdAt: string
}

