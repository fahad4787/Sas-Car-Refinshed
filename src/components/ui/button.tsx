import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,box-shadow,color,border-color] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm before:pointer-events-none before:absolute before:inset-0 before:translate-x-[-120%] before:skew-x-[-18deg] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] before:transition-transform before:duration-500 hover:shadow-md hover:before:translate-x-[120%]',
        outline:
          'border border-border bg-surface/70 before:pointer-events-none before:absolute before:inset-0 before:translate-x-[-120%] before:skew-x-[-18deg] before:bg-[linear-gradient(90deg,transparent,rgba(244,63,94,0.16),transparent)] before:transition-transform before:duration-500 hover:bg-muted hover:before:translate-x-[120%]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

