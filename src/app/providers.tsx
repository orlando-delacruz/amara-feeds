import { ThemeProvider } from 'styled-components'
import type { ReactNode } from 'react'
import type { User } from '@/domain'
import { CartProvider } from '@/features/sales/CartProvider'
import type { CartLine } from '@/features/sales/CartContext'
import { SessionProvider } from '@/features/session/SessionProvider'
import { StoreProvider } from '@/store/StoreProvider'
import { GlobalStyle } from '@/theme/GlobalStyle'
import { tokens } from '@/theme/tokens'

interface AppProvidersProps {
  children: ReactNode
  initialUser?: User | null
  initialCartLines?: CartLine[]
}

export function AppProviders({ children, initialUser, initialCartLines }: AppProvidersProps) {
  return (
    <ThemeProvider theme={tokens}>
      <GlobalStyle />
      <SessionProvider initialUser={initialUser}>
        <StoreProvider>
          <CartProvider initialLines={initialCartLines}>{children}</CartProvider>
        </StoreProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
