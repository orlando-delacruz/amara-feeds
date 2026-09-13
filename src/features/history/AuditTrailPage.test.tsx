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
    expect(await screen.findByText('Sale recorded')).toBeInTheDocument()
    expect(screen.getByText('Payment recorded')).toBeInTheDocument()
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
