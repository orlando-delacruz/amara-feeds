export interface NavItem {
  to: string
  label: string
}

export const staffNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/sales', label: 'Sales' },
  { to: '/customers', label: 'Customers' },
  { to: '/credit', label: 'Credit' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/receiving', label: 'Receiving' },
  { to: '/products', label: 'Products' },
  { to: '/reports', label: 'Reports' },
]

export const adminNavItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/sales', label: 'Sales' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/credit', label: 'Credit' },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/receiving', label: 'Receiving' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/users', label: 'Users' },
]
