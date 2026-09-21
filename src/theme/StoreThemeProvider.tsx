import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { useStore } from '@/store/useStore'
import { storeBranding } from '@/store/storeBranding'
import { syncBrowserChrome } from './browserChrome'
import { GlobalStyle } from './GlobalStyle'
import { storeThemes } from './storeThemes'
import { concreteStoreId } from '@/store/stores'

interface StoreThemeProviderProps {
  children: ReactNode
}

/**
 * Applies the active store's brand theme. Scoped to the staff area:
 * staff are locked to their assigned store, so the whole staff app
 * (buttons, headers, nav) wears that store's paint.
 */
export function StoreThemeProvider({ children }: StoreThemeProviderProps) {
  const { store } = useStore()
  // Staff area only, so the context is always concrete here.
  const concrete = concreteStoreId(store)
  const branding = storeBranding[concrete]

  useEffect(() => {
    syncBrowserChrome(branding.favicon, branding.themeColor)
  }, [branding])

  return (
    <ThemeProvider theme={storeThemes[concrete]}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  )
}
