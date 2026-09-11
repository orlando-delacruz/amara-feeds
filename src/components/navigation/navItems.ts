import type { NavIconName } from './icons'
import type { UserRole } from '@/domain'

export interface NavItem {
  to: string
  label: string
  icon: NavIconName
  /** Shown directly in the mobile tab bar. Non-primary items live on the More page. */
  primary: boolean
  /** Short helper shown under the label on the More page. */
  description: string
}

export const staffNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', primary: true, description: '' },
  { to: '/sales', label: 'Sales', icon: 'sales', primary: true, description: '' },
  { to: '/customers', label: 'Customers', icon: 'customers', primary: true, description: '' },
  { to: '/credit', label: 'Credit', icon: 'credit', primary: true, description: '' },
  {
    to: '/inventory',
    label: 'Inventory',
    icon: 'inventory',
    primary: false,
    description: 'Stock on hand at your store',
  },
  {
    to: '/receiving',
    label: 'Receiving',
    icon: 'receiving',
    primary: false,
    description: 'Record incoming stock',
  },
  {
    to: '/products',
    label: 'Products',
    icon: 'products',
    primary: false,
    description: 'Catalog and pending approvals',
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: 'reports',
    primary: false,
    description: 'Daily summaries and printing',
  },
]

export const adminNavItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', primary: true, description: '' },
  { to: '/admin/sales', label: 'Sales', icon: 'sales', primary: true, description: '' },
  { to: '/admin/customers', label: 'Customers', icon: 'customers', primary: true, description: '' },
  { to: '/admin/credit', label: 'Credit', icon: 'credit', primary: true, description: '' },
  {
    to: '/admin/inventory',
    label: 'Inventory',
    icon: 'inventory',
    primary: false,
    description: 'Stock on hand per store',
  },
  {
    to: '/admin/receiving',
    label: 'Receiving',
    icon: 'receiving',
    primary: false,
    description: 'Incoming stock per store',
  },
  {
    to: '/admin/products',
    label: 'Products',
    icon: 'products',
    primary: false,
    description: 'Review product approvals',
  },
  {
    to: '/admin/reports',
    label: 'Reports',
    icon: 'reports',
    primary: false,
    description: 'Daily summaries and printing',
  },
  {
    to: '/admin/users',
    label: 'Users',
    icon: 'users',
    primary: false,
    description: 'Staff accounts and store assignment',
  },
]

export function navItemsForRole(role: UserRole): NavItem[] {
  return role === 'admin' ? adminNavItems : staffNavItems
}
