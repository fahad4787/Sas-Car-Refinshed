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
import type { CustomerDoc } from '@/features/customers/types'

const customersCollection = collection(db, 'customers')

export function subscribeCustomers(
  onData: (rows: Array<{ id: string; data: CustomerDoc }>) => void,
  onError?: (error: Error) => void,
) {
  const q = query(customersCollection, orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          data: d.data() as CustomerDoc,
        })),
      )
    },
    (err) => onError?.(err as Error),
  )
}

export async function createCustomer(input: { name: string; phone: string; email: string }) {
  await addDoc(customersCollection, {
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    createdAt: serverTimestamp(),
  })
}

export async function removeCustomer(id: string) {
  await deleteDoc(doc(customersCollection, id))
}

export async function updateCustomer(
  id: string,
  input: { name: string; phone: string; email: string },
) {
  await updateDoc(doc(customersCollection, id), {
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
  })
}

