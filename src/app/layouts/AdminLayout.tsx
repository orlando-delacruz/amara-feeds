import { adminNavItems } from '@/components/navigation/navItems'
import { AppShell } from './AppShell'

export function AdminLayout() {
  return (
    <AppShell
      sectionLabel="Admin"
      switchTo="/dashboard"
      switchLabel="Staff view"
      navItems={adminNavItems}
    />
  )
}
