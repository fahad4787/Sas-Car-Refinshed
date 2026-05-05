import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type SkeletonProps = HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-muted',
        'after:absolute after:inset-0 after:translate-x-[-120%] after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] after:animate-shimmer',
        className,
      )}
      {...props}
    />
  )
}

