import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type PageHeaderProps = {
  title: string
  subtitle?: string
  right?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, right, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

