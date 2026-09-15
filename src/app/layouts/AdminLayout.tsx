import { useEffect } from 'react'
import { ThemeProvider } from 'styled-components'
import { adminNavItems } from '@/components/navigation/navItems'
import { adminBrowserChrome, syncBrowserChrome } from '@/theme/browserChrome'
import { adminTheme } from '@/theme/storeThemes'
import { AppShell } from './AppShell'

export function AdminLayout() {
  // Fixed combined theme (DEC-031): the Amara/Zeann filter changes data,
  // never paint.
  useEffect(() => {
    syncBrowserChrome(adminBrowserChrome.favicon, adminBrowserChrome.themeColor)
  }, [])

  return (
    <ThemeProvider theme={adminTheme}>
      <AppShell sectionLabel="Admin" navItems={adminNavItems} brand="dual" />
    </ThemeProvider>
  )
}
