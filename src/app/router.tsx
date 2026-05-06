import { QueryClient } from '@tanstack/react-query'
import { Navigate, Outlet, createRouter, RootRoute, Route } from '@tanstack/react-router'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { DashboardHomePage } from '@/pages/Dashboard/Home'
import { SupplierPage } from '@/pages/Dashboard/Suppliers'
import { RawMaterialPage } from '@/pages/Dashboard/RawMaterials'
import { PurchaseOrderEditPage, PurchaseOrderPage, PurchaseOrdersListPage } from '@/pages/Dashboard/PurchaseOrders'
import { ProductCostingsListPage } from '@/pages/Dashboard/ProductCosting/list'
import { ProductCostingNewPage } from '@/pages/Dashboard/ProductCosting/new'
import { ProductCostingEditPage } from '@/pages/Dashboard/ProductCosting/edit'
import { CustomerPage } from '@/pages/Dashboard/Customers'
import { StockReportPage } from '@/pages/Dashboard/StockReport'
import { PlaceholderPage } from '@/pages/Dashboard/_components/PlaceholderPage'

const rootRoute = new RootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  ),
})

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/dashboard" replace />,
})

const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardLayout,
})

const dashboardIndexRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/',
  component: DashboardHomePage,
})

const supplierRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/suppliers',
  component: SupplierPage,
})

const rawMaterialRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/raw-materials',
  component: RawMaterialPage,
})

const purchaseOrderRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/purchase-orders',
  component: PurchaseOrdersListPage,
})

const purchaseOrderNewRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/purchase-orders/new',
  component: PurchaseOrderPage,
})

const purchaseOrderEditRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/purchase-orders/$purchaseOrderId/edit',
  component: PurchaseOrderEditPage,
})

const productCostingRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/product-costing',
  component: ProductCostingsListPage,
})

const productCostingNewRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/product-costing/new',
  component: ProductCostingNewPage,
})

const productCostingEditRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/product-costing/$productCostingId/edit',
  component: ProductCostingEditPage,
})

const stockReportRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/stock-report',
  component: StockReportPage,
})

const customersRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/customers',
  component: CustomerPage,
})

const posRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/pos',
  component: () => <PlaceholderPage title="POS" />,
})

const customerLedgerRoute = new Route({
  getParentRoute: () => dashboardRoute,
  path: '/customer-ledger',
  component: () => <PlaceholderPage title="Customer Ledger" />,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute.addChildren([
    dashboardIndexRoute,
    supplierRoute,
    rawMaterialRoute,
    purchaseOrderRoute,
    purchaseOrderNewRoute,
    purchaseOrderEditRoute,
    productCostingRoute,
    productCostingNewRoute,
    productCostingEditRoute,
    stockReportRoute,
    customersRoute,
    posRoute,
    customerLedgerRoute,
  ]),
])

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export const queryClient = new QueryClient()

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
})

