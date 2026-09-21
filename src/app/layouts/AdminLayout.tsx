import { StoreThemeProvider } from '@/theme/StoreThemeProvider'
import { adminAllStoresFallback } from '@/theme/storeThemes'
import { adminNavItems } from '@/components/navigation/navItems'
import { AppShell } from './AppShell'

export function AdminLayout() {
  // Paint follows the store context (DEC-044): Amara brown, Zeann blue; the
  // combined "all stores" view keeps the fixed navy theme (DEC-031).
  return (
    <StoreThemeProvider allStores={adminAllStoresFallback}>
      <AppShell sectionLabel="Admin" navItems={adminNavItems} brand="dual" />
    </StoreThemeProvider>
  )
}
