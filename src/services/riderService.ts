import type { NewRiderInput, Rider, UpdateRiderInput } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'
import { ServiceError } from './errors'

export async function listRiders(
  filter: { storeId?: StoreId; active?: boolean } = {},
): Promise<Rider[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('riders')
      .select('id, name, store_id, active, created_by_user_id, created_at')
    if (filter.storeId) {
      query = query.eq('store_id', filter.storeId)
    }
    if (filter.active !== undefined) {
      query = query.eq('active', filter.active)
    }
    const { data, error } = await query.order('name', { ascending: true })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      storeId: row.store_id as StoreId,
      active: row.active,
      createdByUserId: row.created_by_user_id ?? undefined,
      createdAt: row.created_at,
    }))
  }
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
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('create_rider', {
      p_name: name,
      p_store_id: input.storeId,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      id: data?.rider_id as string,
      name,
      storeId: input.storeId,
      active: true,
      createdByUserId: input.createdByUserId,
      createdAt: new Date().toISOString(),
    }
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
  if (isSupabaseConfigured && supabase) {
    const updates: Record<string, unknown> = {}
    if (patch.name !== undefined) {
      const name = patch.name.trim()
      if (!name) {
        throw new ServiceError('validation', 'Rider name is required.')
      }
      updates.name = name
    }
    if (patch.active !== undefined) {
      updates.active = patch.active
    }
    const { data, error } = await supabase
      .from('riders')
      .update(updates)
      .eq('id', id)
      .select('id, name, store_id, active, created_by_user_id, created_at')
      .maybeSingle()
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    // 0 rows = rider missing or blocked by RLS — same contract as the mock.
    if (!data) {
      throw new ServiceError('not_found', 'Rider not found.')
    }
    return {
      id: data.id,
      name: data.name,
      storeId: data.store_id as StoreId,
      active: data.active,
      createdByUserId: data.created_by_user_id ?? undefined,
      createdAt: data.created_at,
    }
  }
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
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('delete_rider', { p_rider_id: id })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      id: data?.rider_id as string,
      name: '',
      storeId: 'amara',
      active: true,
      createdAt: new Date().toISOString(),
    }
  }
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
