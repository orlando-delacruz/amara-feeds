import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SideNav } from './SideNav'
import { adminNavItems, staffNavItems } from './navItems'
import { renderWithProviders } from '@/test/render'

describe('SideNav', () => {
  it('ends with a More entry on desktop so non-listed destinations stay reachable', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/admin']}>
        <SideNav items={adminNavItems} />
      </MemoryRouter>,
      { user: { id: 'user-3', name: 'Owner', role: 'admin', username: 'owner', active: true } },
    )
    // The sidebar itself renders only for desktop widths (media query), so
    // access the hidden tree in jsdom.
    const more = screen.getByRole('link', { name: 'More', hidden: true })
    expect(more).toHaveAttribute('href', '/admin/more')
  })

  it('links staff to the staff More page', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SideNav items={staffNavItems} />
      </MemoryRouter>,
      {
        user: {
          id: 'user-1',
          name: 'Alice',
          role: 'staff',
          storeId: 'amara',
          username: 'alice',
          active: true,
        },
      },
    )
    expect(screen.getByRole('link', { name: 'More', hidden: true })).toHaveAttribute(
      'href',
      '/more',
    )
  })
})
