import type { Timestamp } from 'firebase/firestore'

export type CustomerDoc = {
  name?: string
  phone?: string
  email?: string
  createdAt: Timestamp | null
}

export type Customer = {
  id: string
  name: string
  phone: string
  email: string
  createdAt: string
}

