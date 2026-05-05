import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)

let authBootstrapPromise: Promise<void> | null = null

export function ensureFirebaseAuth() {
  if (authBootstrapPromise) return authBootstrapPromise

  authBootstrapPromise = new Promise<void>((resolve) => {
    let settled = false
    const settle = () => {
      if (settled) return
      settled = true
      resolve()
    }

    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          unsub()
          settle()
          return
        }
        try {
          await signInAnonymously(auth)
        } catch {
          // If anonymous auth isn't enabled, Firestore rules must be public for reads/writes.
        }
      },
      () => {
        unsub()
        settle()
      },
    )

    // Avoid blocking the UI forever if auth cannot initialize.
    window.setTimeout(() => {
      try {
        unsub()
      } finally {
        settle()
      }
    }, 4000)
  })

  return authBootstrapPromise
}

