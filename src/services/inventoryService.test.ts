import { beforeEach, describe, expect, it } from 'vitest'
import { approveStock, deleteStock, getStock, listStock, updateStock } from './inventoryService'
import { listAuditEvents } from './auditService'
import { resetDb } from './mocks/db'

const actor = { userId: 'user-3', role: 'admin' as const }
const staffActor = { userId: 'user-alice', role: 'staff' as const }

describe('inventoryService', () => {
  beforeEach(() => resetDb())

  it('keeps stock separate per store', async () => {
    const amara = await getStock('amara', 'prod-1')
    const zeann = await getStock('zeann', 'prod-1')
    expect(amara.quantity).toBe(20)
    expect(zeann.quantity).toBe(12)
  })

  it('scopes listings by store', async () => {
    const amaraStock = await listStock({ storeId: 'amara' })
    expect(amaraStock.length).toBeGreaterThan(0)
    expect(amaraStock.every((level) => level.storeId === 'amara')).toBe(true)
  })

  describe('updateStock', () => {
    it('sets the absolute quantity and reports the previous value', async () => {
      const saved = await updateStock('amara', 'prod-1', {
        quantity: 9,
        actorUserId: actor.userId,
        actorRole: actor.role,
      })
      expect(saved.previousQuantity).toBe(20)
      expect(saved.level.quantity).toBe(9)
      expect(await getStock('amara', 'prod-1')).toMatchObject({ quantity: 9 })
    })

    it('creates a row when none exists', async () => {
      const saved = await updateStock('amara', 'prod-new', {
        quantity: 5,
        actorUserId: actor.userId,
        actorRole: actor.role,
      })
      expect(saved.level).toEqual({ storeId: 'amara', productId: 'prod-new', quantity: 5 })
      expect(await getStock('amara', 'prod-new')).toMatchObject({ quantity: 5 })
    })

    it('sets the current selling price when provided (DEC-049)', async () => {
      await updateStock('amara', 'prod-1', {
        quantity: 20,
        priceMinor: 118000,
        actorUserId: actor.userId,
        actorRole: actor.role,
      })
      const priced = (await listStock({ storeId: 'amara', productId: 'prod-1' }))[0]
      expect(priced?.priceMinor).toBe(118000)
      // Omitting the price leaves it untouched.
      await updateStock('amara', 'prod-1', {
        quantity: 18,
        actorUserId: actor.userId,
        actorRole: actor.role,
      })
      expect(await getStock('amara', 'prod-1')).toMatchObject({ quantity: 18, priceMinor: 118000 })
    })

    it('rejects non-integer and negative quantities', async () => {
      await expect(
        updateStock('amara', 'prod-1', {
          quantity: -1,
          actorUserId: actor.userId,
          actorRole: actor.role,
        }),
      ).rejects.toMatchObject({ code: 'validation' })
      await expect(
        updateStock('amara', 'prod-1', {
          quantity: 1.5,
          actorUserId: actor.userId,
          actorRole: actor.role,
        }),
      ).rejects.toMatchObject({ code: 'validation' })
    })

    it('records a stock adjusted audit event', async () => {
      await updateStock('amara', 'prod-1', {
        quantity: 9,
        actorUserId: actor.userId,
        actorRole: actor.role,
      })
      const events = await listAuditEvents()
      const event = events.find((item) => item.action === 'stock.updated')
      expect(event).toMatchObject({
        storeId: 'amara',
        subject: 'Rice 25kg',
        detail: 'Adjusted from 20 to 9',
      })
    })
  })

  describe('deleteStock', () => {
    it('removes a row with no sales at the store', async () => {
      // prod-2 has sales only at Zeann.
      const removed = await deleteStock('amara', 'prod-2', actor)
      expect(removed).toEqual({ storeId: 'amara', productId: 'prod-2', quantity: 50 })
    })

    it('refuses to delete a product with sales at the store', async () => {
      // prod-1 has seed sales at both stores.
      await expect(deleteStock('amara', 'prod-1', actor)).rejects.toMatchObject({
        code: 'conflict',
      })
      await expect(deleteStock('zeann', 'prod-1', actor)).rejects.toMatchObject({
        code: 'conflict',
      })
    })

    it('fails when the row does not exist', async () => {
      await expect(deleteStock('amara', 'prod-never', actor)).rejects.toMatchObject({
        code: 'not_found',
      })
    })
  })

  describe('approveStock (approved inventory lock, client change)', () => {
    it('flags the row and writes an audit event', async () => {
      const approved = await approveStock('amara', 'prod-1', { userId: 'user-3', role: 'admin' })
      expect(approved.adminApproved).toBe(true)
      expect(await getStock('amara', 'prod-1')).toMatchObject({ adminApproved: true })
      const events = await listAuditEvents()
      expect(events.some((event) => event.action === 'stock.approved')).toBe(true)
    })

    it('refuses staff approval', async () => {
      await expect(
        approveStock('amara', 'prod-1', { userId: 'user-1', role: 'staff' }),
      ).rejects.toMatchObject({ code: 'validation' })
    })

    it('refuses all staff inventory correction; admins keep access (DEC-050)', async () => {
      await expect(
        updateStock('amara', 'prod-1', {
          quantity: 5,
          actorUserId: staffActor.userId,
          actorRole: staffActor.role,
        }),
      ).rejects.toMatchObject({ code: 'validation' })
      await expect(
        deleteStock('amara', 'prod-2', { userId: staffActor.userId, role: staffActor.role }),
      ).rejects.toMatchObject({ code: 'validation' })
      const saved = await updateStock('amara', 'prod-1', {
        quantity: 7,
        actorUserId: 'user-3',
        actorRole: 'admin',
      })
      expect(saved.level.quantity).toBe(7)
    })
  })
})
