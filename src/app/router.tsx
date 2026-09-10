import { Navigate, Route, Routes } from 'react-router-dom'
import { NotFoundPage, PlaceholderPage } from '@/components/PlaceholderPage'
import { AdminLayout } from './layouts/AdminLayout'
import { StaffLayout } from './layouts/StaffLayout'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<StaffLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <PlaceholderPage
              title="Dashboard"
              scope="Business summaries for oversight."
              requirements="REQ-DASH-001–006"
            />
          }
        />
        <Route
          path="/sales"
          element={
            <PlaceholderPage
              title="Sales"
              scope="Store-specific sale recording: optional customer, items and quantities, cash or charge, delivery details when applicable."
              requirements="REQ-SALE-001–005, REQ-CUST-002"
            />
          }
        />
        <Route
          path="/customers"
          element={
            <PlaceholderPage
              title="Customers"
              scope="Shared customer records across Amara and Zeann."
              requirements="REQ-CUST-001–003"
            />
          }
        />
        <Route
          path="/credit"
          element={
            <PlaceholderPage
              title="Credit / Collection"
              scope="Shared credit with terms-based due dates, partial payments, and cross-store payments in one traceable history."
              requirements="REQ-CRED-001–007, REQ-PAY-001–002"
            />
          }
        />
        <Route
          path="/inventory"
          element={
            <PlaceholderPage
              title="Inventory"
              scope="Store-specific stock, automatically deducted when a sale is saved."
              requirements="REQ-INV-001–002"
            />
          }
        />
        <Route
          path="/receiving"
          element={
            <PlaceholderPage
              title="Receiving Stock"
              scope="Store-specific stock receipts: store, item, quantity, supplier, purchase/cost price."
              requirements="REQ-RCV-001"
            />
          }
        />
        <Route
          path="/products"
          element={
            <PlaceholderPage
              title="Products"
              scope="Product records with staff submission and admin approval before activation."
              requirements="REQ-PROD-001–003"
            />
          }
        />
        <Route
          path="/reports"
          element={
            <PlaceholderPage
              title="Reports / Export / Printing"
              scope="Agreed business summaries with Excel export and printing."
              requirements="REQ-REP-001–002"
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
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
        <Route
          path="products"
          element={
            <PlaceholderPage
              title="Product Approvals"
              scope="Review staff-submitted products; approval activates them."
              requirements="REQ-PROD-002–003"
            />
          }
        />
        <Route
          path="credit"
          element={
            <PlaceholderPage
              title="Credit / Payments Review"
              scope="Shared credit obligations, balances, status, and cross-store payment history."
              requirements="REQ-CRED-006–007, REQ-DASH-003–004"
            />
          }
        />
        <Route
          path="inventory"
          element={
            <PlaceholderPage
              title="Inventory / Receiving Review"
              scope="Current stock and received stock across both stores."
              requirements="REQ-DASH-005–006"
            />
          }
        />
        <Route
          path="reports"
          element={
            <PlaceholderPage
              title="Reports / Export / Printing"
              scope="Agreed business summaries with Excel export and printing."
              requirements="REQ-REP-001–002"
            />
          }
        />
        <Route
          path="users"
          element={
            <PlaceholderPage
              title="Users / Staff"
              scope="Individual staff accounts with store assignment."
              requirements="REQ-USER-001–002"
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
