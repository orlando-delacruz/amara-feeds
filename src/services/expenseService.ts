import type { Expense, NewExpenseInput, StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { assertActiveRecorder } from './userService'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'
import { ServiceError } from './errors'

export async function listExpenses(filter: { storeId?: StoreId } = {}): Promise<Expense[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('expenses')
      .select(
        'id, store_id, rider_id, vehicle_id, type, amount_minor, note, recorded_by_user_id, created_at',
      )
    if (filter.storeId) {
      query = query.eq('store_id', filter.storeId)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      storeId: row.store_id as StoreId,
      riderId: row.rider_id ?? undefined,
      vehicleId: row.vehicle_id ?? undefined,
      type: row.type as Expense['type'],
      amountMinor: row.amount_minor,
      note: row.note ?? undefined,
      recordedByUserId: row.recorded_by_user_id,
      createdAt: row.created_at,
    }))
  }
  return getDb()
    .expenses.filter((record) => !filter.storeId || record.storeId === filter.storeId)
    .map((record) => ({ ...record }))
}

export async function createExpense(input: NewExpenseInput): Promise<Expense> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('create_expense', {
      p_store_id: input.storeId,
      p_rider_id: input.riderId ?? null,
      p_vehicle_id: input.vehicleId ?? null,
      p_type: input.type,
      p_amount_minor: input.amountMinor,
      p_note: input.note ?? null,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      id: data?.expense_id as string,
      storeId: input.storeId,
      riderId: input.riderId,
      vehicleId: input.vehicleId,
      type: input.type,
      amountMinor: input.amountMinor,
      note: input.note?.trim() || undefined,
      recordedByUserId: input.recordedByUserId,
      createdAt: new Date().toISOString(),
    }
  }
  assertActiveRecorder(input.recordedByUserId)
  if (input.amountMinor <= 0) {
    throw new ServiceError('validation', 'Expense amount must be greater than zero.')
  }
  if (!input.riderId && !input.vehicleId) {
    throw new ServiceError('validation', 'Assign the expense to a rider or vehicle.')
  }
  if (input.riderId) {
    const rider = getDb().riders.find((r) => r.id === input.riderId && r.storeId === input.storeId)
    if (!rider || !rider.active) {
      throw new ServiceError('validation', 'Selected rider is not active at this store.')
    }
  }
  if (input.vehicleId) {
    const vehicle = getDb().vehicles.find(
      (v) => v.id === input.vehicleId && v.storeId === input.storeId,
    )
    if (!vehicle || !vehicle.active) {
      throw new ServiceError('validation', 'Selected vehicle is not active at this store.')
    }
  }
  const record: Expense = {
    id: nextId('exp'),
    storeId: input.storeId,
    riderId: input.riderId,
    vehicleId: input.vehicleId,
    type: input.type,
    amountMinor: input.amountMinor,
    note: input.note?.trim() || undefined,
    recordedByUserId: input.recordedByUserId,
    createdAt: new Date().toISOString(),
  }
  getDb().expenses.push(record)
  return { ...record }
}

export interface DeliveryNetEntry {
  id: string
  name: string
  deliveredSalesMinor: number
  expensesMinor: number
  netMinor: number
}

export async function getDeliveryNetSummary(storeId: StoreId): Promise<{
  riders: DeliveryNetEntry[]
  vehicles: DeliveryNetEntry[]
}> {
  const db = getDb()
  const storeExpenses = db.expenses.filter((e) => e.storeId === storeId)
  const storeSales = db.sales.filter((s) => s.storeId === storeId)

  const riderMap = new Map<string, { deliveredSalesMinor: number; expensesMinor: number }>()
  const vehicleMap = new Map<string, { deliveredSalesMinor: number; expensesMinor: number }>()

  for (const sale of storeSales) {
    if (sale.delivery?.riderId) {
      const entry = riderMap.get(sale.delivery.riderId) ?? {
        deliveredSalesMinor: 0,
        expensesMinor: 0,
      }
      entry.deliveredSalesMinor += sale.totalMinor
      riderMap.set(sale.delivery.riderId, entry)
    }
    if (sale.delivery?.vehicleId) {
      const entry = vehicleMap.get(sale.delivery.vehicleId) ?? {
        deliveredSalesMinor: 0,
        expensesMinor: 0,
      }
      entry.deliveredSalesMinor += sale.totalMinor
      vehicleMap.set(sale.delivery.vehicleId, entry)
    }
  }

  for (const expense of storeExpenses) {
    if (expense.riderId) {
      const entry = riderMap.get(expense.riderId) ?? {
        deliveredSalesMinor: 0,
        expensesMinor: 0,
      }
      entry.expensesMinor += expense.amountMinor
      riderMap.set(expense.riderId, entry)
    }
    if (expense.vehicleId) {
      const entry = vehicleMap.get(expense.vehicleId) ?? {
        deliveredSalesMinor: 0,
        expensesMinor: 0,
      }
      entry.expensesMinor += expense.amountMinor
      vehicleMap.set(expense.vehicleId, entry)
    }
  }

  const storeRiders = db.riders.filter((r) => r.storeId === storeId)
  const storeVehicles = db.vehicles.filter((v) => v.storeId === storeId)

  const riders: DeliveryNetEntry[] = storeRiders.map((rider) => {
    const entry = riderMap.get(rider.id) ?? {
      deliveredSalesMinor: 0,
      expensesMinor: 0,
    }
    return {
      id: rider.id,
      name: rider.name,
      deliveredSalesMinor: entry.deliveredSalesMinor,
      expensesMinor: entry.expensesMinor,
      netMinor: entry.deliveredSalesMinor - entry.expensesMinor,
    }
  })

  const vehicles: DeliveryNetEntry[] = storeVehicles.map((vehicle) => {
    const entry = vehicleMap.get(vehicle.id) ?? {
      deliveredSalesMinor: 0,
      expensesMinor: 0,
    }
    return {
      id: vehicle.id,
      name: vehicle.label,
      deliveredSalesMinor: entry.deliveredSalesMinor,
      expensesMinor: entry.expensesMinor,
      netMinor: entry.deliveredSalesMinor - entry.expensesMinor,
    }
  })

  return { riders, vehicles }
}
