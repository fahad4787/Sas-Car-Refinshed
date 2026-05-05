import { Check, ChevronDown, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { cn } from '@/lib/cn'
import { Button } from './button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { Input } from './input'

export type SearchableSelectOption = {
  value: string
  label: string
}

export type SearchableSelectProps = {
  value: string
  onChange: (next: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results',
  disabled,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-10 w-full justify-between rounded-md border border-border bg-surface/60 px-3 py-2 text-sm font-normal shadow-sm outline-none transition-colors hover:bg-surface/60 focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className={cn('truncate', !selected ? 'text-muted-foreground' : undefined)}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] p-2">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-9"
          />
        </div>

        <div className="max-h-64 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
          ) : (
            filtered.map((o) => (
              <DropdownMenuItem
                key={o.value}
                onSelect={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                </span>
                {o.value === value ? <Check className="h-4 w-4 text-primary" /> : null}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

