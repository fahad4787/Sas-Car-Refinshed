import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'muted'
  shape?: 'pill' | 'circle'
  size?: 'sm' | 'md'
}

export function Badge({
  className,
  variant = 'default',
  shape = 'pill',
  size = 'sm',
  ...props
}: BadgeProps) {
  const circleClass =
    size === 'md'
      ? 'h-9 w-9 text-sm'
      : 'h-8 w-8 text-xs'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center border font-semibold tabular-nums',
        shape === 'circle'
          ? cn('rounded-full px-0', circleClass)
          : 'rounded-full px-2 py-0.5 text-xs',
        variant === 'muted'
          ? 'border-border bg-muted/50 text-muted-foreground'
          : 'border-primary/30 bg-primary/10 text-primary',
        className,
      )}
      {...props}
    />
  )
}

