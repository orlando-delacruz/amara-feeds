import type { NewVehicleInput, UpdateVehicleInput, Vehicle } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'
import { ServiceError } from './errors'

export async function listVehicles(
  filter: { storeId?: StoreId; active?: boolean } = {},
): Promise<Vehicle[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('vehicles')
      .select('id, label, store_id, active, created_by_user_id, created_at')
    if (filter.storeId) {
      query = query.eq('store_id', filter.storeId)
    }
    if (filter.active !== undefined) {
      query = query.eq('active', filter.active)
    }
    const { data, error } = await query.order('label', { ascending: true })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      storeId: row.store_id as StoreId,
      active: row.active,
      createdByUserId: row.created_by_user_id ?? undefined,
      createdAt: row.created_at,
    }))
  }
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
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('create_vehicle', {
      p_label: label,
      p_store_id: input.storeId,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      id: data?.vehicle_id as string,
      label,
      storeId: input.storeId,
      active: true,
      createdByUserId: input.createdByUserId,
      createdAt: new Date().toISOString(),
    }
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
  if (isSupabaseConfigured && supabase) {
    const updates: Record<string, unknown> = {}
    if (patch.label !== undefined) {
      const label = patch.label.trim()
      if (!label) {
        throw new ServiceError('validation', 'Vehicle type is required.')
      }
      updates.label = label
    }
    if (patch.active !== undefined) {
      updates.active = patch.active
    }
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select('id, label, store_id, active, created_by_user_id, created_at')
      .single()
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      id: data.id,
      label: data.label,
      storeId: data.store_id as StoreId,
      active: data.active,
      createdByUserId: data.created_by_user_id ?? undefined,
      createdAt: data.created_at,
    }
  }
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
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('delete_vehicle', { p_vehicle_id: id })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      id: data?.vehicle_id as string,
      label: '',
      storeId: 'amara',
      active: true,
      createdAt: new Date().toISOString(),
    }
  }
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
