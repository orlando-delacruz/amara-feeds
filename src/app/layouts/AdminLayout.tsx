import { adminNavItems } from '@/components/navigation/navItems'
import { AppShell } from './AppShell'

export function AdminLayout() {
  return <AppShell sectionLabel="Admin" navItems={adminNavItems} />
}
