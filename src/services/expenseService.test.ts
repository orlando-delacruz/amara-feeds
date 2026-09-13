import { beforeEach, describe, expect, it } from 'vitest'
import { createExpense, getDeliveryNetSummary, listExpenses } from './expenseService'
import { resetDb } from './mocks/db'

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
})
