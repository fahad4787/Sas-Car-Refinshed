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
import type { PurchaseOrderDoc } from '@/features/purchase-orders/types'

const purchaseOrdersCollection = collection(db, 'purchaseOrders')

export function subscribePurchaseOrders(
  onData: (rows: Array<{ id: string; data: PurchaseOrderDoc }>) => void,
  onError?: (error: Error) => void,
) {
  const q = query(purchaseOrdersCollection, orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          data: d.data() as PurchaseOrderDoc,
        })),
      )
    },
    (err) => onError?.(err as Error),
  )
}

export async function createPurchaseOrder(doc: Omit<PurchaseOrderDoc, 'createdAt'>) {
  await addDoc(purchaseOrdersCollection, {
    ...doc,
    createdAt: serverTimestamp(),
  })
}

export async function updatePurchaseOrder(
  id: string,
  input: Omit<PurchaseOrderDoc, 'createdAt'>,
) {
  await updateDoc(doc(purchaseOrdersCollection, id), {
    ...input,
  })
}

export async function removePurchaseOrder(id: string) {
  await deleteDoc(doc(purchaseOrdersCollection, id))
}

