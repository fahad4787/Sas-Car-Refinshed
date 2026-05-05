import { Link, useRouterState } from '@tanstack/react-router'
import {
  BookOpen,
  Boxes,
  ClipboardList,
  CreditCard,
  ChevronDown,
  LayoutDashboard,
  Receipt,
  Settings2,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { Logo } from '@/components/Logo'
import { cn } from '@/lib/cn'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/suppliers', label: 'Supplier Definition', icon: Users },
  { to: '/dashboard/raw-materials', label: 'Raw Material Definition', icon: Boxes },
  {
    label: 'Purchase Orders',
    icon: ClipboardList,
    basePath: '/dashboard/purchase-orders',
    children: [
      { to: '/dashboard/purchase-orders', label: 'All Purchase Orders' },
      { to: '/dashboard/purchase-orders/new', label: 'New Purchase Order' },
    ],
  },
  {
    label: 'Product List',
    icon: Settings2,
    basePath: '/dashboard/product-costing',
    children: [
      { to: '/dashboard/product-costing', label: 'All Products' },
      { to: '/dashboard/product-costing/new', label: 'Create Product' },
    ],
  },
  { to: '/dashboard/stock-report', label: 'Stock Report', icon: BookOpen },
  { to: '/dashboard/customers', label: 'Customer Define', icon: Users },
  { to: '/dashboard/pos', label: 'POS', icon: CreditCard },
  { to: '/dashboard/customer-ledger', label: 'Customer Ledger', icon: Receipt },
  ] as const

export function DashboardSidebar({ collapsed }: { collapsed: boolean }) {
  const location = useRouterState({ select: (s) => s.location })
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const effectiveOpenByLabel = useMemo(() => {
    const map: Record<string, boolean> = {}
    for (const item of navItems) {
      if (!('children' in item)) continue
      const isActive = location.pathname.startsWith(item.basePath)
      map[item.label] = collapsed ? false : isActive ? true : (openGroups[item.label] ?? false)
    }
    return map
  }, [collapsed, location.pathname, openGroups])

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 hidden border-r border-black/10 bg-[linear-gradient(180deg,hsl(222_47%_11%/0.96),hsl(222_47%_11%/0.90))] text-white lg:block',
        collapsed ? 'w-[88px]' : 'w-72',
        'transition-[width] duration-300 ease-out',
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(760px_320px_at_18%_0%,hsl(0_84%_52%/0.18),transparent_64%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(640px_300px_at_92%_12%,hsl(8_90%_55%/0.10),transparent_66%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,hsl(0_0%_100%/0.05),transparent_22%,transparent_82%,hsl(0_0%_0%/0.32))]" />

      <div className={cn('flex h-full flex-col px-3 py-4', collapsed ? 'items-center' : '')}>
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white shadow-sm">
            <div className={cn('flex items-center justify-center py-2 transition-all duration-300 ease-out', collapsed ? 'px-2' : 'px-3')}>
              <Logo
                className={cn(
                  'select-none object-contain transition-all duration-300 ease-out',
                  collapsed ? 'h-8 w-10' : 'h-10 w-full',
                )}
              />
            </div>
          </div>
        </div>

        <div
          className={cn(
            'mt-5 flex-1 overflow-auto pr-1',
            collapsed ? 'w-full pr-0' : '',
          )}
        >
          <nav className="space-y-1">
            {navItems.map((item) => {
              if ('children' in item) {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.basePath)
                const open = effectiveOpenByLabel[item.label] ?? false
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      type="button"
                      title={item.label}
                      onClick={() =>
                        setOpenGroups((cur) => ({ ...cur, [item.label]: !(cur[item.label] ?? false) }))
                      }
                      className={cn(
                        'group relative flex w-full items-start rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ease-out',
                        collapsed ? 'justify-center gap-0' : 'gap-3',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-white/85 hover:bg-white/6 hover:text-white',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          isActive
                            ? 'text-primary-foreground'
                            : 'text-white/60 group-hover:text-white',
                          'transition-colors duration-200',
                        )}
                      />
                      <span
                        className={cn(
                          'min-w-0 truncate whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out',
                          collapsed
                            ? 'max-w-0 opacity-0 -translate-x-2'
                            : 'max-w-[220px] opacity-100 translate-x-0',
                        )}
                      >
                        {item.label}
                      </span>
                      {!collapsed ? (
                        <ChevronDown
                          className={cn(
                            'absolute right-2 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 transition-transform duration-200',
                            open ? 'rotate-0' : '-rotate-90',
                            isActive ? 'text-primary-foreground' : 'text-white/60 group-hover:text-white',
                          )}
                        />
                      ) : null}
                    </button>

                    {open ? (
                      <div
                        className={cn(
                          collapsed ? 'hidden' : 'ml-3 space-y-1 border-l border-white/10 pl-4',
                        )}
                      >
                        {item.children.map((child) => {
                          const childActive = location.pathname === child.to
                          return (
                            <Link
                              key={child.to}
                              to={child.to}
                              title={child.label}
                              className={cn(
                                'flex items-center rounded-lg px-4 py-2.5 text-[13px] leading-none transition-all duration-200 ease-out',
                                childActive
                                  ? 'bg-white/12 text-white'
                                  : 'text-white/75 hover:bg-white/6 hover:text-white',
                              )}
                            >
                              <span className="min-w-0 truncate">{child.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              }

              const isActive =
                location.pathname === item.to ||
                (item.to !== '/dashboard' &&
                  location.pathname.startsWith(item.to + '/'))

              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={cn(
                    'group flex items-center rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ease-out',
                    collapsed ? 'justify-center gap-0' : 'gap-3',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-white/85 hover:bg-white/6 hover:text-white',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-white/60 group-hover:text-white',
                      'transition-colors duration-200',
                    )}
                  />
                  <span
                    className={cn(
                      'min-w-0 truncate whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out',
                      collapsed
                        ? 'max-w-0 opacity-0 -translate-x-2'
                        : 'max-w-[220px] opacity-100 translate-x-0',
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>
  )
}

