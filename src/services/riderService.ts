import type { NewRiderInput, Rider, UpdateRiderInput } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { ServiceError } from './errors'

export async function listRiders(
  filter: { storeId?: StoreId; active?: boolean } = {},
): Promise<Rider[]> {
  return getDb()
    .riders.filter(
      (rider) =>
        (!filter.storeId || rider.storeId === filter.storeId) &&
        (filter.active === undefined || rider.active === filter.active),
    )
    .map((rider) => ({ ...rider }))
}

export async function createRider(input: NewRiderInput): Promise<Rider> {
  const name = input.name.trim()
  if (!name) {
    throw new ServiceError('validation', 'Rider name is required.')
  }
  const rider: Rider = {
    id: nextId('rider'),
    name,
    storeId: input.storeId,
    active: true,
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
  }
  getDb().riders.push(rider)
  return { ...rider }
}

export async function updateRider(id: string, patch: UpdateRiderInput): Promise<Rider> {
  const rider = getDb().riders.find((item) => item.id === id)
  if (!rider) {
    throw new ServiceError('not_found', 'Rider not found.')
  }
  if (patch.name !== undefined) {
    const name = patch.name.trim()
    if (!name) {
      throw new ServiceError('validation', 'Rider name is required.')
    }
    rider.name = name
  }
  if (patch.active !== undefined) {
    rider.active = patch.active
  }
  return { ...rider }
}

export async function setRiderActive(id: string, active: boolean): Promise<Rider> {
  return updateRider(id, { active })
}

function riderInUse(id: string): boolean {
  const db = getDb()
  return (
    db.sales.some((sale) => sale.delivery?.riderId === id) ||
    db.receiving.some((record) => record.riderId === id) ||
    db.expenses.some((expense) => expense.riderId === id)
  )
}

/**
 * Removes a rider. Riders referenced by sales, receiving, or expenses are kept
 * so history stays intact — those must be deactivated instead.
 */
export async function deleteRider(id: string): Promise<Rider> {
  const db = getDb()
  const index = db.riders.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new ServiceError('not_found', 'Rider not found.')
  }
  if (riderInUse(id)) {
    throw new ServiceError(
      'conflict',
      'This rider is used by existing sales, receiving, or expenses. Deactivate it instead.',
    )
  }
  const [removed] = db.riders.splice(index, 1)
  return { ...removed }
}
