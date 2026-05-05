import type { SelectHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-border bg-surface/60 px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

