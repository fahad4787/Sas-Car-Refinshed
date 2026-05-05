import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type ContainerProps = HTMLAttributes<HTMLDivElement>

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-5xl', className)} {...props} />
  )
}

