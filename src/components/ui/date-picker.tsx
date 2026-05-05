import { Calendar as CalendarIcon } from 'lucide-react'
import ReactDatePicker from 'react-datepicker'
import { useMemo } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/cn'
import { Button } from './button'

function parseYmd(value: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return new Date(`${value}T00:00:00`)
}

function toYmd(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export type DatePickerProps = {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({ value, onChange, placeholder = 'Select date', disabled, className }: DatePickerProps) {
  const selected = useMemo(() => parseYmd(value), [value])
  const label = useMemo(() => {
    if (!selected) return placeholder
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(selected)
  }, [placeholder, selected])

  return (
    <ReactDatePicker
      selected={selected}
      onChange={(d: Date | null) => {
        if (!d || Array.isArray(d)) return
        onChange(toYmd(d))
      }}
      disabled={disabled}
      dateFormat="dd MMM yyyy"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      popperPlacement="bottom-start"
      popperContainer={({ children }) => createPortal(children, document.body)}
      popperClassName="z-[60]"
      wrapperClassName="w-full"
      customInput={
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-10 w-full justify-start gap-2 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm font-normal shadow-sm',
            !selected ? 'text-muted-foreground' : undefined,
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </Button>
      }
    />
  )
}

