import type { NewRiderInput, Rider } from '@/domain'
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

export async function setRiderActive(id: string, active: boolean): Promise<Rider> {
  const rider = getDb().riders.find((item) => item.id === id)
  if (!rider) {
    throw new ServiceError('not_found', 'Rider not found.')
  }
  rider.active = active
  return { ...rider }
}
