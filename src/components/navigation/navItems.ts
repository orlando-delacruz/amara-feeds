import type { NavIconName } from './icons'

export interface NavItem {
  to: string
  label: string
  icon: NavIconName
  /** Shown directly in the mobile tab bar. Non-primary items live in the More sheet. */
  primary: boolean
}

export const staffNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', primary: true },
  { to: '/sales', label: 'Sales', icon: 'sales', primary: true },
  { to: '/customers', label: 'Customers', icon: 'customers', primary: true },
  { to: '/credit', label: 'Credit', icon: 'credit', primary: true },
  { to: '/inventory', label: 'Inventory', icon: 'inventory', primary: false },
  { to: '/receiving', label: 'Receiving', icon: 'receiving', primary: false },
  { to: '/products', label: 'Products', icon: 'products', primary: false },
  { to: '/reports', label: 'Reports', icon: 'reports', primary: false },
]

export const adminNavItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', primary: true },
  { to: '/admin/sales', label: 'Sales', icon: 'sales', primary: true },
  { to: '/admin/customers', label: 'Customers', icon: 'customers', primary: true },
  { to: '/admin/credit', label: 'Credit', icon: 'credit', primary: true },
  { to: '/admin/inventory', label: 'Inventory', icon: 'inventory', primary: false },
  { to: '/admin/receiving', label: 'Receiving', icon: 'receiving', primary: false },
  { to: '/admin/products', label: 'Products', icon: 'products', primary: false },
  { to: '/admin/reports', label: 'Reports', icon: 'reports', primary: false },
  { to: '/admin/users', label: 'Users', icon: 'users', primary: false },
]
