import * as React from 'react'

import { cn } from '@/lib/cn'

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('mb-3 block text-sm font-medium leading-none', className)}
        {...props}
      />
    )
  },
)
Label.displayName = 'Label'

