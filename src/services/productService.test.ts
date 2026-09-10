import { beforeEach, describe, expect, it } from 'vitest'
import { approveProduct, createProduct, listProducts } from './productService'
import { resetDb } from './mocks/db'

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
})
