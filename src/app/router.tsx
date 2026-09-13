import { Navigate, Route, Routes } from 'react-router-dom'
import { NotFoundPage } from '@/components/PlaceholderPage'
import { CustomerListPage } from '@/features/customers/CustomerListPage'
import { CreditDetailPage } from '@/features/credit/CreditDetailPage'
import { CreditListPage } from '@/features/credit/CreditListPage'
import { AdminDashboardPage } from '@/features/dashboard/AdminDashboardPage'
import { StaffDashboardPage } from '@/features/dashboard/StaffDashboardPage'
import { RidersPage } from '@/features/delivery/RidersPage'
import { VehiclesPage } from '@/features/delivery/VehiclesPage'
import { ExpensesPage } from '@/features/expenses/ExpensesPage'
import { InventoryPage } from '@/features/inventory/InventoryPage'
import { MorePage } from '@/features/more/MorePage'
import { ProductApprovalPage } from '@/features/products/ProductApprovalPage'
import { ProductListPage } from '@/features/products/ProductListPage'
import { ReceivingPage } from '@/features/receiving/ReceivingPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { NewSalePage } from '@/features/sales/NewSalePage'
import { SaleListPage } from '@/features/sales/SaleListPage'
import { RequireRole } from '@/features/session/guards'
import { SignInPage } from '@/features/session/SignInPage'
import { useHomePath } from '@/features/session/useHomePath'
import { StaffListPage } from '@/features/users/StaffListPage'
import { AdminLayout } from './layouts/AdminLayout'
import { StaffLayout } from './layouts/StaffLayout'

function HomeRedirect() {
  return <Navigate to={useHomePath()} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />

      <Route element={<RequireRole role="staff" />}>
        <Route element={<StaffLayout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="dashboard" element={<StaffDashboardPage />} />
          <Route path="sales" element={<SaleListPage />} />
          <Route path="sales/new" element={<NewSalePage />} />
          <Route path="customers" element={<CustomerListPage />} />
          <Route path="credit" element={<CreditListPage />} />
          <Route path="credit/:creditId" element={<CreditDetailPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="receiving" element={<ReceivingPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="riders" element={<RidersPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="customers" element={<CustomerListPage canAdd={false} />} />
          <Route path="sales" element={<SaleListPage basePath="/admin/sales" />} />
          <Route path="sales/new" element={<NewSalePage basePath="/admin/sales" />} />
          <Route path="credit" element={<CreditListPage basePath="/admin/credit" />} />
          <Route path="credit/:creditId" element={<CreditDetailPage basePath="/admin/credit" />} />
          <Route path="products" element={<ProductApprovalPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="receiving" element={<ReceivingPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="riders" element={<RidersPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="users" element={<StaffListPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
