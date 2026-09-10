import { staffNavItems } from '@/components/navigation/navItems'
import { AppShell } from './AppShell'

export function StaffLayout() {
  return (
    <AppShell
      sectionLabel="Staff"
      switchTo="/admin"
      switchLabel="Admin view"
      navItems={staffNavItems}
    />
  )
}
