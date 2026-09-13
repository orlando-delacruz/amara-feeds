import type { NewProductInput, Product, ProductId, ProductStatus } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { ServiceError } from './errors'

export async function listProducts(filter: { status?: ProductStatus } = {}): Promise<Product[]> {
  const products = getDb().products
  const scoped = filter.status
    ? products.filter((product) => product.status === filter.status)
    : products
  return scoped.map((product) => ({ ...product }))
}

export async function getProduct(id: ProductId): Promise<Product> {
  const product = getDb().products.find((item) => item.id === id)
  if (!product) {
    throw new ServiceError('not_found', 'Product not found.')
  }
  return { ...product }
}

export async function createProduct(input: NewProductInput): Promise<Product> {
  const name = input.name.trim()
  if (!name) {
    throw new ServiceError('validation', 'Product name is required.')
  }
  const product: Product = {
    id: nextId('prod'),
    name,
    status: 'pending',
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
  }
  getDb().products.push(product)
  return { ...product }
}

export async function approveProduct(id: ProductId): Promise<Product> {
  const product = getDb().products.find((item) => item.id === id)
  if (!product) {
    throw new ServiceError('not_found', 'Product not found.')
  }
  if (product.status !== 'pending') {
    throw new ServiceError('conflict', 'Only pending products can be approved.')
  }
  product.status = 'active'
  return { ...product }
}

export async function rejectProduct(id: ProductId): Promise<Product> {
  const db = getDb()
  const index = db.products.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new ServiceError('not_found', 'Product not found.')
  }
  const product = db.products[index]
  if (product.status !== 'pending') {
    throw new ServiceError('conflict', 'Only pending products can be rejected.')
  }
  const [removed] = db.products.splice(index, 1)
  return { ...removed }
}
