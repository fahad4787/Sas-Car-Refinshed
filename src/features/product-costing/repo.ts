import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { ProductCostingDoc } from '@/features/product-costing/types'

const productCostingsCollection = collection(db, 'productCostings')

export function subscribeProductCostings(
  onData: (rows: Array<{ id: string; data: ProductCostingDoc }>) => void,
  onError?: (error: Error) => void,
) {
  const q = query(productCostingsCollection, orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          data: d.data() as ProductCostingDoc,
        })),
      )
    },
    (err) => onError?.(err as Error),
  )
}

export async function createProductCosting(docInput: Omit<ProductCostingDoc, 'createdAt'>) {
  await addDoc(productCostingsCollection, {
    ...docInput,
    createdAt: serverTimestamp(),
  })
}

export async function removeProductCosting(id: string) {
  await deleteDoc(doc(productCostingsCollection, id))
}

