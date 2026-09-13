import type { NewVehicleInput, Vehicle } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { ServiceError } from './errors'

export async function listVehicles(
  filter: { storeId?: StoreId; active?: boolean } = {},
): Promise<Vehicle[]> {
  return getDb()
    .vehicles.filter(
      (vehicle) =>
        (!filter.storeId || vehicle.storeId === filter.storeId) &&
        (filter.active === undefined || vehicle.active === filter.active),
    )
    .map((vehicle) => ({ ...vehicle }))
}

export async function createVehicle(input: NewVehicleInput): Promise<Vehicle> {
  const label = input.label.trim()
  if (!label) {
    throw new ServiceError('validation', 'Vehicle type is required.')
  }
  const vehicle: Vehicle = {
    id: nextId('vehicle'),
    label,
    storeId: input.storeId,
    active: true,
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
  }
  getDb().vehicles.push(vehicle)
  return { ...vehicle }
}

export async function setVehicleActive(id: string, active: boolean): Promise<Vehicle> {
  const vehicle = getDb().vehicles.find((item) => item.id === id)
  if (!vehicle) {
    throw new ServiceError('not_found', 'Vehicle not found.')
  }
  vehicle.active = active
  return { ...vehicle }
}
