import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import {
  listAuditEvents,
  listAuditEventsForUser,
  logAuditEvent,
} from '@/services/auditService'
import type { User } from '@/domain'

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

const ben: User = {
  id: 'user-2',
  name: 'Ben',
  role: 'staff',
  storeId: 'zeann',
  username: 'ben',
  active: true,
}

describe('auditService', () => {
  beforeEach(() => resetDb())

  it('derives history from stored records', async () => {
    const events = await listAuditEvents()
    const actions = events.map((event) => event.action)
    expect(actions).toContain('sale.recorded')
    expect(actions).toContain('payment.recorded')
    expect(actions).toContain('receiving.recorded')
    expect(actions).toContain('product.submitted')
    // Newest first.
    for (let index = 1; index < events.length; index += 1) {
      expect(events[index - 1].createdAt >= events[index].createdAt).toBe(true)
    }
  })

  it('lets admins see everything', async () => {
    const all = await listAuditEvents()
    const admin = await listAuditEventsForUser(adminUser)
    expect(admin).toHaveLength(all.length)
  })

  it('scopes staff to their own actions plus connected admin actions', async () => {
    await logAuditEvent({
      action: 'product.approved',
      actorUserId: adminUser.id,
      actorRole: 'admin',
      relatedUserId: alice.id,
      subject: 'Cooking Oil 1L',
    })

    const aliceEvents = await listAuditEventsForUser(alice)
    expect(aliceEvents.length).toBeGreaterThan(0)
    expect(
      aliceEvents.every(
        (event) => event.actorUserId === alice.id || event.relatedUserId === alice.id,
      ),
    ).toBe(true)
    expect(
      aliceEvents.some(
        (event) => event.action === 'product.approved' && event.relatedUserId === alice.id,
      ),
    ).toBe(true)

    const benEvents = await listAuditEventsForUser(ben)
    expect(
      benEvents.some(
        (event) => event.action === 'product.approved' && event.relatedUserId === alice.id,
      ),
    ).toBe(false)
  })
})
