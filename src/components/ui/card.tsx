import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_0_0_hsl(222_47%_11%/0.06)_inset,0_10px_26px_-22px_hsl(222_47%_11%/0.25)] before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(180deg,hsl(0_84%_52%/0.06),transparent_42%)]',
        className,
      )}
      {...props}
    />
  )
}

type CardHeaderProps = HTMLAttributes<HTMLDivElement>

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn('px-6 pt-6', className)} {...props} />
}

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
  )
}

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p className={cn('mt-1 text-sm text-muted-foreground', className)} {...props} />
  )
}

type CardContentProps = HTMLAttributes<HTMLDivElement>

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('px-6 pb-6 pt-4', className)} {...props} />
}

