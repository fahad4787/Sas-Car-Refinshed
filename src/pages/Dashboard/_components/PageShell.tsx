import { useEffect, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

type PageShellProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function PageShell({ title, description, actions, children, className }: PageShellProps) {
  useEffect(() => {
    const appName = 'SAS Car Refinish'
    document.title = title ? `${appName} | ${title}` : appName
  }, [title])

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}

