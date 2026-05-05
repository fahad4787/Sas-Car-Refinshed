import { Outlet } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'

import { DashboardHeader } from '@/layouts/DashboardLayout/header'
import { DashboardSidebar } from '@/layouts/DashboardLayout/sidebar'

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((v) => !v)
  }, [])

  const sidebarWidthClass = useMemo(
    () => (sidebarCollapsed ? 'lg:pl-[88px]' : 'lg:pl-72'),
    [sidebarCollapsed],
  )

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_700px_at_20%_0%,hsl(0_84%_52%/0.16),transparent_55%),radial-gradient(900px_650px_at_90%_10%,hsl(210_100%_55%/0.10),transparent_55%),radial-gradient(900px_700px_at_60%_110%,hsl(145_75%_40%/0.08),transparent_55%)]" />

      <DashboardSidebar collapsed={sidebarCollapsed} />

      <div className={sidebarWidthClass}>
        <DashboardHeader onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
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

