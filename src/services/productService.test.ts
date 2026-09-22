import { beforeEach, describe, expect, it } from 'vitest'
import { approveProduct, createProduct, listProducts, rejectProduct } from './productService'
import { getDb, resetDb } from './mocks/db'

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
