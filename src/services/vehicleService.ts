import type { NewVehicleInput, UpdateVehicleInput, Vehicle } from '@/domain'
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

export async function updateVehicle(id: string, patch: UpdateVehicleInput): Promise<Vehicle> {
  const vehicle = getDb().vehicles.find((item) => item.id === id)
  if (!vehicle) {
    throw new ServiceError('not_found', 'Vehicle not found.')
  }
  if (patch.label !== undefined) {
    const label = patch.label.trim()
    if (!label) {
      throw new ServiceError('validation', 'Vehicle type is required.')
    }
    vehicle.label = label
  }
  if (patch.active !== undefined) {
    vehicle.active = patch.active
  }
  return { ...vehicle }
}

export async function setVehicleActive(id: string, active: boolean): Promise<Vehicle> {
  return updateVehicle(id, { active })
}

function vehicleInUse(id: string): boolean {
  const db = getDb()
  return (
    db.sales.some((sale) => sale.delivery?.vehicleId === id) ||
    db.receiving.some((record) => record.vehicleId === id) ||
    db.expenses.some((expense) => expense.vehicleId === id)
  )
}

/**
 * Removes a vehicle. Vehicles referenced by sales, receiving, or expenses are
 * kept so history stays intact — those must be deactivated instead.
 */
export async function deleteVehicle(id: string): Promise<Vehicle> {
  const db = getDb()
  const index = db.vehicles.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new ServiceError('not_found', 'Vehicle not found.')
  }
  if (vehicleInUse(id)) {
    throw new ServiceError(
      'conflict',
      'This vehicle is used by existing sales, receiving, or expenses. Deactivate it instead.',
    )
  }
  const [removed] = db.vehicles.splice(index, 1)
  return { ...removed }
}
