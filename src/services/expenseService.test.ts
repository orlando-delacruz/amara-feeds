import { beforeEach, describe, expect, it } from 'vitest'
import {
  createExpense,
  deleteExpense,
  getDeliveryNetSummary,
  listExpenses,
  updateExpense,
} from './expenseService'
import { getDb, resetDb } from './mocks/db'

describe('expenseService', () => {
  beforeEach(() => resetDb())

  it('records an expense for a rider', async () => {
    const record = await createExpense({
      storeId: 'amara',
      riderId: 'rider-1',
      type: 'fuel',
      amountMinor: 50000,
      note: 'Weekly fuel',
      recordedByUserId: 'user-1',
    })
    expect(record.id).toBeTruthy()
    expect(record.riderId).toBe('rider-1')
    expect(record.type).toBe('fuel')
    expect(record.amountMinor).toBe(50000)
  })

  it('records an expense for a vehicle', async () => {
    const record = await createExpense({
      storeId: 'amara',
      vehicleId: 'vehicle-1',
      type: 'repair',
      amountMinor: 120000,
      recordedByUserId: 'user-1',
    })
    expect(record.id).toBeTruthy()
    expect(record.vehicleId).toBe('vehicle-1')
  })

  it('records an expense for both rider and vehicle', async () => {
    const record = await createExpense({
      storeId: 'amara',
      riderId: 'rider-1',
      vehicleId: 'vehicle-1',
      type: 'fuel',
      amountMinor: 30000,
      recordedByUserId: 'user-1',
    })
    expect(record.riderId).toBe('rider-1')
    expect(record.vehicleId).toBe('vehicle-1')
  })

  it('rejects a non-positive amount', async () => {
    await expect(
      createExpense({
        storeId: 'amara',
        riderId: 'rider-1',
        type: 'fuel',
        amountMinor: 0,
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('rejects missing rider and vehicle', async () => {
    await expect(
      createExpense({
        storeId: 'amara',
        type: 'fuel',
        amountMinor: 50000,
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('rejects a rider not belonging to the store', async () => {
    await expect(
      createExpense({
        storeId: 'amara',
        riderId: 'rider-3',
        type: 'fuel',
        amountMinor: 50000,
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('rejects an inactive rider', async () => {
    const { setRiderActive } = await import('./riderService')
    await setRiderActive('rider-1', false)
    await expect(
      createExpense({
        storeId: 'amara',
        riderId: 'rider-1',
        type: 'fuel',
        amountMinor: 50000,
        recordedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('lists expenses scoped by store', async () => {
    const amara = await listExpenses({ storeId: 'amara' })
    expect(amara.length).toBeGreaterThan(0)
    expect(amara.every((record) => record.storeId === 'amara')).toBe(true)
  })

  it('computes delivery net summary', async () => {
    const summary = await getDeliveryNetSummary('amara')
    expect(summary.riders.length).toBeGreaterThan(0)
    expect(summary.vehicles.length).toBeGreaterThan(0)
    const jojo = summary.riders.find((r) => r.id === 'rider-1')
    expect(jojo).toBeDefined()
    expect(jojo!.expensesMinor).toBeGreaterThan(0)
  })

  it('deletes an expense and drops it from the list (DEC-055)', async () => {
    const deleted = await deleteExpense('exp-1')
    expect(deleted).toBe('exp-1')
    expect(getDb().expenses.some((record) => record.id === 'exp-1')).toBe(false)
    expect((await listExpenses({ storeId: 'amara' })).some((record) => record.id === 'exp-1')).toBe(
      false,
    )
    // Other records are untouched.
    expect(getDb().expenses.length).toBe(2)
  })

  it('throws not_found for an unknown expense id (DEC-055)', async () => {
    await expect(deleteExpense('exp-missing')).rejects.toMatchObject({ code: 'not_found' })
  })

  it('edits type, amount, note, and target (DEC-056)', async () => {
    const saved = await updateExpense('exp-1', {
      vehicleId: 'vehicle-1',
      type: 'repair',
      amountMinor: 120000,
      note: 'Corrected note',
    })
    expect(saved.riderId).toBeUndefined()
    expect(saved.vehicleId).toBe('vehicle-1')
    expect(saved.type).toBe('repair')
    expect(saved.amountMinor).toBe(120000)
    expect(saved.note).toBe('Corrected note')
    expect(saved.storeId).toBe('amara')
  })

  it('rejects invalid edits (DEC-056)', async () => {
    await expect(
      updateExpense('exp-1', { riderId: 'rider-1', type: 'fuel', amountMinor: 0 }),
    ).rejects.toMatchObject({ code: 'validation' })
    await expect(
      updateExpense('exp-1', { type: 'fuel', amountMinor: 50000 }),
    ).rejects.toMatchObject({ code: 'validation' })
    await expect(
      updateExpense('exp-1', { riderId: 'rider-3', type: 'fuel', amountMinor: 50000 }),
    ).rejects.toMatchObject({ code: 'validation' })
    await expect(
      updateExpense('exp-missing', { riderId: 'rider-1', type: 'fuel', amountMinor: 50000 }),
    ).rejects.toMatchObject({ code: 'not_found' })
  })
})
