import { ThemeProvider } from 'styled-components'
import type { ReactNode } from 'react'
import type { User } from '@/domain'
import { SessionProvider } from '@/features/session/SessionProvider'
import { StoreProvider } from '@/store/StoreProvider'
import { GlobalStyle } from '@/theme/GlobalStyle'
import { tokens } from '@/theme/tokens'

interface AppProvidersProps {
  children: ReactNode
  initialUser?: User | null
}

export function AppProviders({ children, initialUser = null }: AppProvidersProps) {
  return (
    <ThemeProvider theme={tokens}>
      <GlobalStyle />
      <SessionProvider initialUser={initialUser}>
        <StoreProvider>{children}</StoreProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
