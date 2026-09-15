import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { AppProviders } from '@/app/providers'
import type { CartLine } from '@/features/sales/CartContext'
import type { User } from '@/domain'
import type { StoreId } from '@/store/stores'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null
  cart?: CartLine[]
  store?: StoreId
}

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { user = null, cart, store, ...rest } = options
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders initialUser={user} initialCartLines={cart} initialStore={store}>
        {children}
      </AppProviders>
    )
  }
  return render(ui, { wrapper: Wrapper, ...rest })
}
