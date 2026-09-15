import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { useStore } from '@/store/useStore'
import { storeBranding } from '@/store/storeBranding'
import { syncBrowserChrome } from './browserChrome'
import { GlobalStyle } from './GlobalStyle'
import { storeThemes } from './storeThemes'

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
  const branding = storeBranding[store]

  useEffect(() => {
    syncBrowserChrome(branding.favicon, branding.themeColor)
  }, [branding])

  return (
    <ThemeProvider theme={storeThemes[store]}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  )
}
