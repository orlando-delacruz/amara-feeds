import { staffNavItems } from '@/components/navigation/navItems'
import { StoreThemeProvider } from '@/theme/StoreThemeProvider'
import { AppShell } from './AppShell'

export function StaffLayout() {
  return (
    <StoreThemeProvider>
      <AppShell sectionLabel="Staff" navItems={staffNavItems} brand="store" />
    </StoreThemeProvider>
  )
}
