import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import { logAuditEvent } from '@/services/auditService'
import { renderWithProviders } from '@/test/render'
import type { User } from '@/domain'
import { AuditTrailPage } from './AuditTrailPage'

const adminUser: User = {
  id: 'user-3',
  name: 'Owner',
  role: 'admin',
  username: 'owner',
  active: true,
}

const alice: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

describe('AuditTrailPage', () => {
  beforeEach(() => resetDb())

  it('shows admins the business-wide history', async () => {
    renderWithProviders(<AuditTrailPage />, { user: adminUser })
    expect(await screen.findByText('History')).toBeInTheDocument()
    expect((await screen.findAllByText('Sale recorded')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Payment recorded').length).toBeGreaterThan(0)
  })

  it('lets admins filter history by store', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AuditTrailPage />, { user: adminUser })

    expect((await screen.findAllByText(/Sale at Amara/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Sale at Zeann/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('radio', { name: 'Zeann' }))

    expect((await screen.findAllByText(/Sale at Zeann/)).length).toBeGreaterThan(0)
    expect(screen.queryAllByText(/Sale at Amara/)).toHaveLength(0)
  })

  it('shows the encoder of sales, credits, and expenses to admins (DEC-067)', async () => {
    await logAuditEvent({
      action: 'credit.imported',
      actorUserId: adminUser.id,
      actorRole: 'admin',
      storeId: 'amara',
      subject: 'Maria Santos',
      detail: 'Existing credit · 1 item(s) · 1150.00',
    })
    renderWithProviders(<AuditTrailPage />, { user: adminUser })

    expect(await screen.findByText('Existing credit encoded')).toBeInTheDocument()
    // Every action row carries its encoder: "Name · Admin/Staff" in the By column.
    expect((await screen.findAllByText(/Owner · Admin/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Alice · Staff/).length).toBeGreaterThan(0)
    // Sales and expenses resolve their recorders too.
    expect(screen.getAllByText('Sale recorded').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Expense recorded').length).toBeGreaterThan(0)
  })

  it('scopes staff to their own actions plus connected admin decisions', async () => {
    await logAuditEvent({
      action: 'product.approved',
      actorUserId: adminUser.id,
      actorRole: 'admin',
      relatedUserId: alice.id,
      subject: 'Cooking Oil 1L',
    })
    const user = userEvent.setup()
    renderWithProviders(<AuditTrailPage />, { user: alice })

    expect(await screen.findByText('Product approved')).toBeInTheDocument()
    // Alice's own seeded submission stays visible.
    expect(screen.getByText('Product submitted')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'My actions' }))
    expect(screen.queryByText('Product approved')).not.toBeInTheDocument()
  })
})
