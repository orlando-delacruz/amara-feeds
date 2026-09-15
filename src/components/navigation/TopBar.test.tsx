import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TopBar } from './TopBar'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'

const amaraStaff: User = {
  id: 'user-1',
  name: 'Alice (Amara staff)',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

const zeannStaff: User = {
  id: 'user-2',
  name: 'Ben (Zeann staff)',
  role: 'staff',
  storeId: 'zeann',
  username: 'ben',
  active: true,
}

const adminUser: User = {
  id: 'user-3',
  name: 'Owner (admin)',
  role: 'admin',
  username: 'owner',
  active: true,
}

function renderTopBar(user: User | null, store?: 'amara' | 'zeann') {
  renderWithProviders(
    <MemoryRouter>
      <TopBar sectionLabel="Sales" brand="store" />
    </MemoryRouter>,
    { user, store },
  )
}

function renderDualTopBar(user: User | null, store?: 'amara' | 'zeann') {
  renderWithProviders(
    <MemoryRouter>
      <TopBar sectionLabel="Admin" brand="dual" />
    </MemoryRouter>,
    { user, store },
  )
}

describe('TopBar store branding', () => {
  it('shows the Amara logo for Amara staff', () => {
    renderTopBar(amaraStaff)
    const logo = screen.getByAltText('Amara logo')
    expect(logo.getAttribute('src')).toContain('amara-logo-clear')
    expect(screen.queryByAltText('Zeann logo')).not.toBeInTheDocument()
  })

  it('shows the Zeann logo for Zeann staff', () => {
    renderTopBar(zeannStaff)
    const logo = screen.getByAltText('Zeann logo')
    expect(logo.getAttribute('src')).toContain('zeann-logo-clear')
    expect(screen.queryByAltText('Amara logo')).not.toBeInTheDocument()
  })

  it('follows the switched store context for admins', () => {
    renderTopBar(adminUser, 'zeann')
    expect(screen.getByAltText('Zeann logo')).toBeInTheDocument()
  })

  it('shows both store logos in dual mode regardless of the filter', () => {
    renderDualTopBar(adminUser, 'zeann')
    expect(screen.getByAltText('Amara logo')).toBeInTheDocument()
    expect(screen.getByAltText('Zeann logo')).toBeInTheDocument()
  })
})
