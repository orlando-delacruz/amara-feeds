import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SideNav } from './SideNav'
import { adminNavItems, staffNavItems } from './navItems'
import type { User } from '@/domain'
import { renderWithProviders } from '@/test/render'

const adminUser: User = { id: 'user-3', name: 'Owner', role: 'admin', username: 'owner', active: true }

describe('SideNav', () => {
  it('lists every admin destination with no More entry', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/admin']}>
        <SideNav items={adminNavItems} />
      </MemoryRouter>,
      { user: adminUser },
    )
    // The sidebar itself renders only for desktop widths (media query), so
    // access the hidden tree in jsdom.
    for (const item of adminNavItems) {
      expect(screen.getByRole('link', { name: item.label, hidden: true })).toHaveAttribute(
        'href',
        item.to,
      )
    }
    expect(screen.queryByRole('link', { name: 'More', hidden: true })).not.toBeInTheDocument()
  })

  it('surfaces My Account and the store switch for admins', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/admin']}>
        <SideNav items={adminNavItems} />
      </MemoryRouter>,
      { user: adminUser },
    )
    expect(screen.getByRole('link', { name: 'My Account', hidden: true })).toHaveAttribute(
      'href',
      '/admin/account',
    )
    expect(screen.getByRole('radiogroup', { name: 'Store', hidden: true })).toBeInTheDocument()
  })

  it('lists every staff destination with no footer and no More entry', () => {
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
    for (const item of staffNavItems) {
      expect(screen.getByRole('link', { name: item.label, hidden: true })).toHaveAttribute(
        'href',
        item.to,
      )
    }
    expect(screen.queryByRole('link', { name: 'More', hidden: true })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'My Account', hidden: true }),
    ).not.toBeInTheDocument()
  })
})
