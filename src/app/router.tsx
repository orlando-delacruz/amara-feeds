import { Navigate, Route, Routes } from 'react-router-dom'
import { NotFoundPage, PlaceholderPage } from '@/components/PlaceholderPage'
import { CustomerListPage } from '@/features/customers/CustomerListPage'
import { InventoryPage } from '@/features/inventory/InventoryPage'
import { ProductApprovalPage } from '@/features/products/ProductApprovalPage'
import { ProductListPage } from '@/features/products/ProductListPage'
import { ReceivingPage } from '@/features/receiving/ReceivingPage'
import { NewSalePage } from '@/features/sales/NewSalePage'
import { SaleListPage } from '@/features/sales/SaleListPage'
import { RequireRole } from '@/features/session/guards'
import { SignInPage } from '@/features/session/SignInPage'
import { useHomePath } from '@/features/session/useHomePath'
import { AdminLayout } from './layouts/AdminLayout'
import { StaffLayout } from './layouts/StaffLayout'

interface AreaPlaceholder {
  path: string
  title: string
  scope: string
  requirements: string
}

const staffAreas: AreaPlaceholder[] = [
  {
    path: 'dashboard',
    title: 'Dashboard',
    scope: 'Business summaries for oversight.',
    requirements: 'REQ-DASH-001–006',
  },
  {
    path: 'credit',
    title: 'Credit / Collection',
    scope:
      'Shared credit with terms-based due dates, partial payments, and cross-store payments in one traceable history.',
    requirements: 'REQ-CRED-001–007, REQ-PAY-001–002',
  },
  {
    path: 'reports',
    title: 'Reports / Export / Printing',
    scope: 'Agreed business summaries with Excel export and printing.',
    requirements: 'REQ-REP-001–002',
  },
]

const adminAreas: AreaPlaceholder[] = [
  {
    path: 'credit',
    title: 'Credit / Payments Review',
    scope: 'Shared credit obligations, balances, status, and cross-store payment history.',
    requirements: 'REQ-CRED-006–007, REQ-DASH-003–004',
  },
  {
    path: 'inventory',
    title: 'Inventory Review',
    scope: 'Current stock across both stores.',
    requirements: 'REQ-DASH-005',
  },
  {
    path: 'reports',
    title: 'Reports / Export / Printing',
    scope: 'Agreed business summaries with Excel export and printing.',
    requirements: 'REQ-REP-001–002',
  },
]

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
          <Route path="customers" element={<CustomerListPage />} />
          <Route path="sales" element={<SaleListPage />} />
          <Route path="sales/new" element={<NewSalePage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="receiving" element={<ReceivingPage />} />
          {staffAreas.map((area) => (
            <Route
              key={area.path}
              path={area.path}
              element={
                <PlaceholderPage
                  title={area.title}
                  scope={area.scope}
                  requirements={area.requirements}
                />
              }
            />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route element={<RequireRole role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={
              <PlaceholderPage
                title="Admin Dashboard"
                scope="Business-wide oversight across both stores."
                requirements="REQ-USER-003, REQ-DASH-001–006"
              />
            }
          />
          <Route path="customers" element={<CustomerListPage canAdd={false} />} />
          <Route path="sales" element={<SaleListPage />} />
          <Route path="products" element={<ProductApprovalPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="receiving" element={<ReceivingPage />} />
          {adminAreas.map((area) => (
            <Route
              key={area.path}
              path={area.path}
              element={
                <PlaceholderPage
                  title={area.title}
                  scope={area.scope}
                  requirements={area.requirements}
                />
              }
            />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
