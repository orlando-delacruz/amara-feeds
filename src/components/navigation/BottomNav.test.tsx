import { screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { adminNavItems, staffNavItems } from './navItems'
import { renderWithProviders } from '@/test/render'

function renderNav(path: string, role: 'staff' | 'admin' = 'staff') {
  renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav items={role === 'admin' ? adminNavItems : staffNavItems} />
    </MemoryRouter>,
  )
  return screen.getByRole('navigation', { name: 'Primary' })
}

function currentLinks(nav: HTMLElement) {
  return within(nav)
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
    .map((link) => link.textContent)
}

describe('BottomNav', () => {
  it('renders five icon-plus-label tabs with the More destination', () => {
    const nav = renderNav('/dashboard')
    for (const label of ['Dashboard', 'Sales', 'Customers', 'Credit', 'More']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(within(nav).getByRole('link', { name: 'More' })).toHaveAttribute('href', '/more')
  })

  it('marks the primary tab as current on its own path', () => {
    const nav = renderNav('/dashboard')
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'More' })).not.toHaveAttribute('aria-current')
  })

  it('keeps the parent tab current on nested paths', () => {
    const nav = renderNav('/sales/new')
    expect(currentLinks(nav)).toEqual(['Sales'])
  })

  it('marks More as current on overflow destinations', () => {
    const nav = renderNav('/inventory')
    const more = within(nav).getByRole('link', { name: 'More' })
    expect(more).toHaveAttribute('aria-current', 'page')
    expect(more).toHaveClass('active')
    expect(currentLinks(nav)).toEqual(['More'])
  })

  it('marks More as current on the More page itself', () => {
    const nav = renderNav('/more')
    expect(currentLinks(nav)).toEqual(['More'])
  })

  it('uses the admin More destination and marks it current on admin overflow paths', () => {
    const nav = renderNav('/admin/inventory', 'admin')
    const more = within(nav).getByRole('link', { name: 'More' })
    expect(more).toHaveAttribute('href', '/admin/more')
    expect(more).toHaveAttribute('aria-current', 'page')
    expect(currentLinks(nav)).toEqual(['More'])
  })
})
