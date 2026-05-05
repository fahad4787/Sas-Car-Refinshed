import { useRouterState } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'

const titleByPrefix: Array<{ prefix: string; title: string; subtitle?: string }> = [
  { prefix: '/dashboard/suppliers', title: 'Supplier Definition' },
  { prefix: '/dashboard/raw-materials', title: 'Raw Material Definition' },
  { prefix: '/dashboard/purchase-orders', title: 'Purchase Order' },
  { prefix: '/dashboard/product-costing', title: 'Product List' },
  { prefix: '/dashboard/stock-report', title: 'Stock Report' },
  { prefix: '/dashboard/customers', title: 'Customer Define' },
  { prefix: '/dashboard/pos', title: 'POS' },
  { prefix: '/dashboard/customer-ledger', title: 'Customer Ledger' },
  { prefix: '/dashboard', title: 'Dashboard' },
]

export function DashboardHeader({
  onToggleSidebar,
  sidebarCollapsed,
}: {
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
}) {
  const location = useRouterState({ select: (s) => s.location })
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const meta = useMemo(() => {
    const found = titleByPrefix.find((x) =>
      location.pathname === x.prefix || location.pathname.startsWith(x.prefix + '/'),
    )
    return found ?? { prefix: '/dashboard', title: 'Dashboard', subtitle: undefined }
  }, [location.pathname])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return
      const target = e.target as Node | null
      if (target && menuRef.current && !menuRef.current.contains(target)) setOpen(false)
    }

    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY || document.documentElement.scrollTop || 0
      setScrolled(y > 8)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-10 border-b transition-[background-color,box-shadow,border-color,color] duration-300 ease-out',
        scrolled
          ? 'border-white/10 bg-[linear-gradient(180deg,hsl(222_47%_11%/0.96),hsl(222_47%_11%/0.90))] text-white shadow-[0_14px_40px_-28px_hsl(0_0%_0%/0.55)]'
          : 'border-border bg-[linear-gradient(180deg,hsl(0_84%_52%/0.06),transparent_70%),hsl(0_0%_100%)] text-foreground shadow-[0_10px_30px_-26px_hsl(222_47%_11%/0.25)]',
      )}
    >
      <div className="flex items-center gap-3 px-3 py-3 lg:px-4">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            scrolled &&
              'border-white/15 bg-white/10 text-white hover:bg-white/14 hover:text-white',
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        <div className="min-w-0">
          <div
            className={cn(
              'truncate text-base font-semibold tracking-tight',
              scrolled ? 'text-white' : 'text-foreground',
            )}
          >
            {meta.title}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'h-9 w-9 rounded-full border shadow-sm transition-colors',
              scrolled
                ? 'border-white/15 bg-white/10 hover:bg-white/14'
                : 'border-border bg-surface-2 hover:bg-muted',
            )}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Account menu"
          />
          {open ? (
            <div
              role="menu"
              className={cn(
                'absolute right-3 top-[52px] w-44 rounded-2xl border p-1 shadow-[0_14px_40px_-30px_hsl(222_47%_11%/0.35)]',
                scrolled
                  ? 'border-white/10 bg-[linear-gradient(180deg,hsl(222_47%_11%/0.96),hsl(222_47%_11%/0.90))]'
                  : 'border-border bg-surface',
              )}
            >
              <button
                role="menuitem"
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
                  scrolled ? 'text-white/90 hover:bg-white/10' : 'hover:bg-muted',
                )}
                onClick={() => {
                  setOpen(false)
                }}
              >
                <LogOut className={cn('h-4 w-4', scrolled ? 'text-white/70' : 'text-muted-foreground')} />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

