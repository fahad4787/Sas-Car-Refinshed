import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { Toaster } from 'sonner'

import { queryClient } from '@/app/router'
import { ensureFirebaseAuth } from '@/lib/firebase'

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void ensureFirebaseAuth()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  )
}

