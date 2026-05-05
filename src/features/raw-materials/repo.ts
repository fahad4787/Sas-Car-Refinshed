import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { RawMaterialDoc } from '@/features/raw-materials/types'

const rawMaterialsCollection = collection(db, 'rawMaterials')

export function subscribeRawMaterials(
  onData: (rows: Array<{ id: string; data: RawMaterialDoc }>) => void,
  onError?: (error: Error) => void,
) {
  const q = query(rawMaterialsCollection, orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          data: d.data() as RawMaterialDoc,
        })),
      )
    },
    (err) => onError?.(err as Error),
  )
}

export async function createRawMaterial(input: { name: string; description: string; unit: string }) {
  await addDoc(rawMaterialsCollection, {
    name: input.name.trim(),
    description: input.description.trim(),
    unit: input.unit.trim(),
    createdAt: serverTimestamp(),
  })
}

export async function updateRawMaterial(
  id: string,
  input: { name: string; description: string; unit: string },
) {
  await updateDoc(doc(rawMaterialsCollection, id), {
    name: input.name.trim(),
    description: input.description.trim(),
    unit: input.unit.trim(),
  })
}

export async function removeRawMaterial(id: string) {
  await deleteDoc(doc(rawMaterialsCollection, id))
}

