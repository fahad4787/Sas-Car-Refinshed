import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { CardContent, TableContainer } from '@/components/ui'

type DataTableProps = {
  children: ReactNode
  empty?: ReactNode
  isEmpty?: boolean
  className?: string
}

export function DataTable({ children, empty, isEmpty, className }: DataTableProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border', className)}>
      {isEmpty ? <CardContent className="py-10">{empty}</CardContent> : null}
      <TableContainer className={isEmpty ? 'hidden' : undefined}>{children}</TableContainer>
    </div>
  )
}

