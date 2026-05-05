import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/cn'

type LogoProps = Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'alt'> & {
  alt?: string
}

export function Logo({ className, alt = 'Sas Car Refinish', ...props }: LogoProps) {
  return (
    <img
      src="/logo.jpeg"
      alt={alt}
      className={cn('select-none', className)}
      {...props}
    />
  )
}

