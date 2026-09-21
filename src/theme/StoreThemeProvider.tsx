import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { useStore } from '@/store/useStore'
import { isAllStores } from '@/store/stores'
import { storeBranding } from '@/store/storeBranding'
import { syncBrowserChrome } from './browserChrome'
import { GlobalStyle } from './GlobalStyle'
import { storeThemes } from './storeThemes'
import { concreteStoreId } from '@/store/stores'
import type { Theme } from './tokens'

/** Chrome values consumed by syncBrowserChrome (storeBranding satisfies this). */
interface BrowserChrome {
  favicon: string
  themeColor: string
}

interface StoreThemeProviderProps {
  children: ReactNode
  /**
   * Paint for the combined "all stores" context. The staff area never passes
   * it (staff are store-locked); the admin shell passes the fixed navy
   * combined theme, and concrete store contexts wear that store's paint
   * (Amara brown, Zeann blue — DEC-044).
   */
  allStores?: {
    theme: Theme
    chrome: BrowserChrome
  }
}

/**
 * Applies the active store's brand theme. The whole area (buttons, headers,
 * nav) wears that store's paint.
 */
export function StoreThemeProvider({ children, allStores }: StoreThemeProviderProps) {
  const { store } = useStore()

  let theme: Theme
  let branding: BrowserChrome
  if (allStores && isAllStores(store)) {
    theme = allStores.theme
    branding = allStores.chrome
  } else {
    const concrete = concreteStoreId(store)
    theme = storeThemes[concrete]
    branding = storeBranding[concrete]
  }

  useEffect(() => {
    syncBrowserChrome(branding.favicon, branding.themeColor)
  }, [branding])

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  )
}
