import { ThemeProvider } from 'styled-components'
import type { ReactNode } from 'react'
import type { User } from '@/domain'
import { CartProvider } from '@/features/sales/CartProvider'
import type { CartLine } from '@/features/sales/CartContext'
import { SessionProvider } from '@/features/session/SessionProvider'
import { StoreProvider } from '@/store/StoreProvider'
import type { StoreContextId } from '@/store/stores'
import { GlobalStyle } from '@/theme/GlobalStyle'
import { tokens } from '@/theme/tokens'

interface AppProvidersProps {
  children: ReactNode
  initialUser?: User | null
  initialCartLines?: CartLine[]
  initialStore?: StoreContextId
}

export function AppProviders({
  children,
  initialUser,
  initialCartLines,
  initialStore,
}: AppProvidersProps) {
  // Base theme only; each area applies its own theme: the staff layout
  // follows the assigned store, the admin layout uses the fixed combined
  // theme, and the sign-in page uses the fixed neutral theme (DEC-031).
  return (
    <ThemeProvider theme={tokens}>
      <GlobalStyle />
      <SessionProvider initialUser={initialUser}>
        <StoreProvider initialStore={initialStore}>
          <CartProvider initialLines={initialCartLines}>{children}</CartProvider>
        </StoreProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
