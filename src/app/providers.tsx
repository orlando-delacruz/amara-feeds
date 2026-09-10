import { ThemeProvider } from 'styled-components'
import type { ReactNode } from 'react'
import { StoreProvider } from '@/store/StoreProvider'
import { GlobalStyle } from '@/theme/GlobalStyle'
import { tokens } from '@/theme/tokens'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={tokens}>
      <GlobalStyle />
      <StoreProvider>{children}</StoreProvider>
    </ThemeProvider>
  )
}
