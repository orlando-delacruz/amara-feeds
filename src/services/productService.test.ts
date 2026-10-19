import { beforeEach, describe, expect, it } from 'vitest'
import {
  approveProduct,
  createProduct,
  listProducts,
  rejectProduct,
  renameProduct,
} from './productService'
import { getDb, resetDb } from './mocks/db'
import { ServiceError } from './errors'

const admin = { userId: 'user-admin', role: 'admin' as const }

describe('productService', () => {
  beforeEach(() => resetDb())

  it('creates a product in pending state', async () => {
    const product = await createProduct({ name: 'New Item' })
    expect(product.status).toBe('pending')
  })

  it('keeps new products out of the active list until approved', async () => {
    const product = await createProduct({ name: 'New Item' })
    const activeBefore = await listProducts({ status: 'active' })
    expect(activeBefore.map((item) => item.id)).not.toContain(product.id)

    const approved = await approveProduct(product.id)
    expect(approved.status).toBe('active')

    const activeAfter = await listProducts({ status: 'active' })
    expect(activeAfter.map((item) => item.id)).toContain(product.id)
  })

  it('refuses to approve a product that is not pending', async () => {
    await expect(approveProduct('prod-1')).rejects.toMatchObject({ code: 'conflict' })
  })

  it('rejects softly: the record stays and disappears from pending and active (DEC-051)', async () => {
    const product = await createProduct({ name: 'Reject Me', createdByUserId: 'user-1' })
    const rejected = await rejectProduct(product.id)
    expect(rejected.status).toBe('rejected')

    expect((await listProducts({ status: 'pending' })).map((item) => item.id)).not.toContain(
      product.id,
    )
    expect((await listProducts({ status: 'active' })).map((item) => item.id)).not.toContain(
      product.id,
    )
    // The record itself remains in the database.
    expect(getDb().products.some((item) => item.id === product.id)).toBe(true)
  })

  it('refuses to reject a product twice', async () => {
    const product = await createProduct({ name: 'Reject Once', createdByUserId: 'user-1' })
    await rejectProduct(product.id)
    await expect(rejectProduct(product.id)).rejects.toMatchObject({ code: 'conflict' })
  })
})

describe('renameProduct', () => {
  beforeEach(() => {
    resetDb()
    const db = getDb()
    db.products.length = 0
    db.products.push(
      {
        id: 'prod-1',
        name: 'Whole Tilapia',
        status: 'active',
        createdByUserId: 'user-1',
        createdAt: '2026-03-01T00:00:00.000Z',
      },
      {
        id: 'prod-2',
        name: 'Trout Starter Feed',
        status: 'active',
        createdByUserId: 'user-1',
        createdAt: '2026-03-01T00:00:00.000Z',
      },
    )
  })

  it('renames an active item for an admin', async () => {
    await renameProduct('prod-1', '  Tilapia, Whole  ', admin)
    expect(getDb().products[0]?.name).toBe('Tilapia, Whole')
  })

  it('refuses a name already used by another active item', async () => {
    await expect(renameProduct('prod-1', 'trout starter feed', admin)).rejects.toBeInstanceOf(
      ServiceError,
    )
    expect(getDb().products[0]?.name).toBe('Whole Tilapia')
  })

  it('refuses non-admins, matching the admin-only inventory correction rule', async () => {
    await expect(
      renameProduct('prod-1', 'Renamed', { userId: 'user-2', role: 'staff' }),
    ).rejects.toBeInstanceOf(ServiceError)
  })

  it('leaves an active item alone when another PENDING item already uses the name', async () => {
    getDb().products.push({
      id: 'prod-3',
      name: 'Duckweed Flakes',
      status: 'pending',
      createdByUserId: 'user-1',
      createdAt: '2026-03-02T00:00:00.000Z',
    })
    await renameProduct('prod-1', 'Duckweed Flakes', admin)
    expect(getDb().products[0]?.name).toBe('Duckweed Flakes')
  })
})