import { Outlet, useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DashboardHeader } from '@/layouts/DashboardLayout/header'
import { DashboardSidebar } from '@/layouts/DashboardLayout/sidebar'

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (mq.matches) setMobileMenuOpen(false)
    }
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggleSidebar = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setSidebarCollapsed((v) => !v)
    } else {
      setMobileMenuOpen((v) => !v)
    }
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const sidebarWidthClass = useMemo(
    () => (sidebarCollapsed ? 'lg:pl-[88px]' : 'lg:pl-72'),
    [sidebarCollapsed],
  )

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_700px_at_20%_0%,hsl(0_84%_52%/0.16),transparent_55%),radial-gradient(900px_650px_at_90%_10%,hsl(210_100%_55%/0.10),transparent_55%),radial-gradient(900px_700px_at_60%_110%,hsl(145_75%_40%/0.08),transparent_55%)]" />

      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/45 lg:hidden"
          onClick={closeMobileMenu}
        />
      ) : null}

      <DashboardSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onNavigate={closeMobileMenu}
      />

      <div className={sidebarWidthClass}>
        <DashboardHeader
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
          mobileMenuOpen={mobileMenuOpen}
        />
        <main className="px-2 py-4 sm:px-4 sm:py-6">
          <div className="w-full max-w-[1700px] lg:mx-auto">
            <div className="rounded-[28px] border border-border bg-background/90 p-4 shadow-[0_20px_60px_-40px_hsl(222_47%_11%/0.30)] sm:p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

