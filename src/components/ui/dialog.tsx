import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/45', className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    disableClose?: boolean
  }
>(({ className, children, disableClose, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface shadow-[0_24px_70px_-60px_hsl(222_47%_11%/0.45)]',
        className,
      )}
      onEscapeKeyDown={(e) => {
        if (disableClose) e.preventDefault()
        props.onEscapeKeyDown?.(e)
      }}
      onPointerDownOutside={(e) => {
        if (disableClose) e.preventDefault()
        props.onPointerDownOutside?.(e)
      }}
      onInteractOutside={(e) => {
        if (disableClose) e.preventDefault()
        props.onInteractOutside?.(e)
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute right-3 top-3 h-9 w-9 border-white/25 bg-white/10 text-white hover:bg-white/20"
          aria-label="Close"
          disabled={disableClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-t-2xl bg-primary px-6 py-5 text-primary-foreground',
      className,
    )}
    {...props}
  />
)

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('mt-1 text-sm text-primary-foreground/85', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 py-5', className)} {...props} />
)

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center justify-end gap-2 rounded-b-2xl border-t border-border bg-surface-2 px-6 py-4',
      className,
    )}
    {...props}
  />
)

