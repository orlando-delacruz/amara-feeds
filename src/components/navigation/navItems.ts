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
    to: '/history',
    label: 'History',
    icon: 'history',
    primary: false,
    description: 'Your actions and admin replies',
  },
  {
    to: '/riders',
    label: 'Riders',
    icon: 'rider',
    primary: false,
    description: 'Delivery riders at your store',
  },
  {
    to: '/vehicles',
    label: 'Vehicles',
    icon: 'vehicle',
    primary: false,
    description: 'Vehicle types used for deliveries',
  },
  {
    to: '/expenses',
    label: 'Expenses',
    icon: 'expense',
    primary: false,
    description: 'Fuel and repair costs per rider/vehicle',
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
    description: 'Incoming stock and item approvals',
  },
  {
    to: '/admin/history',
    label: 'History',
    icon: 'history',
    primary: false,
    description: 'Staff and admin actions across stores',
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
  {
    to: '/admin/riders',
    label: 'Riders',
    icon: 'rider',
    primary: false,
    description: 'Delivery riders per store',
  },
  {
    to: '/admin/vehicles',
    label: 'Vehicles',
    icon: 'vehicle',
    primary: false,
    description: 'Vehicle types used for deliveries',
  },
  {
    to: '/admin/expenses',
    label: 'Expenses',
    icon: 'expense',
    primary: false,
    description: 'Fuel and repair costs per rider/vehicle',
  },
]

export function navItemsForRole(role: UserRole): NavItem[] {
  return role === 'admin' ? adminNavItems : staffNavItems
}
