import { Calendar as CalendarIcon } from 'lucide-react'
import ReactDatePicker from 'react-datepicker'
import { useMemo } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/cn'
import { Button } from './button'

export type DateRange = {
  from: Date | null
  to: Date | null
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function startOfMonth(year: number, monthIndex: number) {
  return startOfDay(new Date(year, monthIndex, 1))
}

function endOfMonth(year: number, monthIndex: number) {
  return endOfDay(new Date(year, monthIndex + 1, 0))
}

function startOfYear(year: number) {
  return startOfDay(new Date(year, 0, 1))
}

function endOfYear(year: number) {
  return endOfDay(new Date(year, 11, 31))
}

export type DateRangePickerProps = {
  value: DateRange
  onChange: (next: DateRange) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const now = useMemo(() => new Date(), [])
  const currentYear = now.getFullYear()

  const years = useMemo(() => {
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
  }, [currentYear])

  const label = useMemo(() => {
    if (!value.from && !value.to) return 'All dates'
    const fmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
    const from = value.from ? fmt.format(value.from) : '—'
    const to = value.to ? fmt.format(value.to) : '—'
    return `${from} → ${to}`
  }, [value.from, value.to])

  return (
    <ReactDatePicker
      selected={value.from}
      startDate={value.from}
      endDate={value.to}
      onChange={(dates) => {
        if (!dates || !Array.isArray(dates)) return
        const [start, end] = dates
        onChange({
          from: start ? startOfDay(start) : null,
          to: end ? endOfDay(end) : null,
        })
      }}
      selectsRange
      monthsShown={2}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      dateFormat="dd MMM yyyy"
      popperPlacement="bottom-end"
      popperContainer={({ children }) => createPortal(children, document.body)}
      popperClassName="z-[60]"
      wrapperClassName="w-full"
      calendarContainer={({ className: containerClassName, children }) => (
        <div className={cn('rounded-2xl border border-border bg-surface p-3 shadow-[0_18px_55px_-45px_hsl(222_47%_11%/0.35)]', containerClassName)}>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => {
                const end = endOfDay(new Date())
                const start = startOfDay(new Date())
                start.setDate(start.getDate() - 29)
                onChange({ from: start, to: end })
              }}
            >
              Last 30 days
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => onChange({ from: startOfMonth(currentYear, now.getMonth()), to: endOfMonth(currentYear, now.getMonth()) })}
            >
              This month
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => onChange({ from: startOfYear(currentYear), to: endOfYear(currentYear) })}
            >
              This year
            </Button>
            <Button type="button" variant="outline" className="h-9" onClick={() => onChange({ from: null, to: null })}>
              Clear
            </Button>
          </div>

          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <select
              className="flex h-10 w-full rounded-md border border-border bg-surface/60 px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-ring"
              defaultValue={`${currentYear}-${now.getMonth()}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map((x) => Number(x))
                onChange({ from: startOfMonth(y, m), to: endOfMonth(y, m) })
              }}
            >
              {years.flatMap((y) =>
                Array.from({ length: 12 }).map((_, m) => {
                  const dt = new Date(y, m, 1)
                  const optionLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(dt)
                  return (
                    <option key={`${y}-${m}`} value={`${y}-${m}`}>
                      {optionLabel}
                    </option>
                  )
                }),
              )}
            </select>

            <select
              className="flex h-10 w-full rounded-md border border-border bg-surface/60 px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-ring"
              defaultValue={currentYear}
              onChange={(e) => {
                const y = Number(e.target.value)
                onChange({ from: startOfYear(y), to: endOfYear(y) })
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {children}
        </div>
      )}
      customInput={
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-10 w-full justify-start gap-2 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm font-normal shadow-sm',
            !value.from && !value.to ? 'text-muted-foreground' : undefined,
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

