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
import type { SupplierDoc } from '@/features/suppliers/types'

const suppliersCollection = collection(db, 'suppliers')

export function subscribeSuppliers(
  onData: (rows: Array<{ id: string; data: SupplierDoc }>) => void,
  onError?: (error: Error) => void,
) {
  const q = query(suppliersCollection, orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          data: d.data() as SupplierDoc,
        })),
      )
    },
    (err) => onError?.(err as Error),
  )
}

export async function createSupplier(input: {
  customerCode: string
  companyName: string
  contact: string
}) {
  await addDoc(suppliersCollection, {
    customerCode: input.customerCode.trim(),
    companyName: input.companyName.trim(),
    contact: input.contact.trim(),
    createdAt: serverTimestamp(),
  })
}

export async function removeSupplier(id: string) {
  await deleteDoc(doc(suppliersCollection, id))
}

export async function updateSupplier(
  id: string,
  input: { customerCode: string; companyName: string; contact: string },
) {
  await updateDoc(doc(suppliersCollection, id), {
    customerCode: input.customerCode.trim(),
    companyName: input.companyName.trim(),
    contact: input.contact.trim(),
  })
}

