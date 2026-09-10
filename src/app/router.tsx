import { Navigate, Route, Routes } from 'react-router-dom'
import { NotFoundPage, PlaceholderPage } from '@/components/PlaceholderPage'
import { CustomerListPage } from '@/features/customers/CustomerListPage'
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
    path: 'sales',
    title: 'Sales',
    scope:
      'Store-specific sale recording: optional customer, items and quantities, cash or charge, delivery details when applicable.',
    requirements: 'REQ-SALE-001–005, REQ-CUST-002',
  },
  {
    path: 'credit',
    title: 'Credit / Collection',
    scope:
      'Shared credit with terms-based due dates, partial payments, and cross-store payments in one traceable history.',
    requirements: 'REQ-CRED-001–007, REQ-PAY-001–002',
  },
  {
    path: 'inventory',
    title: 'Inventory',
    scope: 'Store-specific stock, automatically deducted when a sale is saved.',
    requirements: 'REQ-INV-001–002',
  },
  {
    path: 'receiving',
    title: 'Receiving Stock',
    scope: 'Store-specific stock receipts: store, item, quantity, supplier, purchase/cost price.',
    requirements: 'REQ-RCV-001',
  },
  {
    path: 'products',
    title: 'Products',
    scope: 'Product records with staff submission and admin approval before activation.',
    requirements: 'REQ-PROD-001–003',
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
    path: 'sales',
    title: 'Sales Review',
    scope: 'Review store-specific sales across both stores.',
    requirements: 'REQ-SALE-001–005, REQ-USER-003',
  },
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
    path: 'receiving',
    title: 'Receiving Review',
    scope: 'Received stock across both stores.',
    requirements: 'REQ-DASH-006',
  },
  {
    path: 'products',
    title: 'Product Approvals',
    scope: 'Review staff-submitted products; approval activates them.',
    requirements: 'REQ-PROD-002–003',
  },
  {
    path: 'reports',
    title: 'Reports / Export / Printing',
    scope: 'Agreed business summaries with Excel export and printing.',
    requirements: 'REQ-REP-001–002',
  },
  {
    path: 'users',
    title: 'Users / Staff',
    scope: 'Individual staff accounts with store assignment.',
    requirements: 'REQ-USER-001–002',
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
