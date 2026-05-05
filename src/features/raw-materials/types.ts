import type { Timestamp } from 'firebase/firestore'

export type RawMaterialDoc = {
  name: string
  description: string
  unit: string
  createdAt: Timestamp | null
}

export type RawMaterial = {
  id: string
  name: string
  description: string
  unit: string
  createdAt: string
}

