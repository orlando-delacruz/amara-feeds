import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { AppProviders } from '@/app/providers'
import type { User } from '@/domain'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null
}

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { user = null, ...rest } = options
  function Wrapper({ children }: { children: ReactNode }) {
    return <AppProviders initialUser={user}>{children}</AppProviders>
  }
  return render(ui, { wrapper: Wrapper, ...rest })
}
