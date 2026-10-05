import { beforeEach, describe, expect, it } from 'vitest'
import { getDb, resetDb } from '@/services/mocks/db'
import { createSale } from '@/services/saleService'
import { createCustomer } from '@/services/customerService'
import { createExistingCredit } from '@/services/creditService'
import { createExpense } from '@/services/expenseService'
import {
  buildCreditReportRows,
  buildExpenseRecordRows,
  buildExpenseReportRows,
  buildSalesReportRows,
} from './reportRows'
import { todayIso } from '@/lib/dates'

describe('buildSalesReportRows', () => {
  beforeEach(() => resetDb())

  it('expands each sale into one row per line with per-sale fields on the first line', async () => {
    const customer = await createCustomer({ name: 'Dina Cruz' })
    const sale = await createSale({
      storeId: 'amara',
      saleDate: todayIso(),
      customerId: customer.id,
      paymentType: 'cash',
      paymentMethod: 'GCash',
      lines: [
        { productId: 'prod-1', quantity: 2, unitPriceMinor: 115000 },
        { productId: 'prod-2', quantity: 1, unitPriceMinor: 6500 },
      ],
      delivery: { feeMinor: 5000, riderId: 'rider-1', vehicleId: 'vehicle-1' },
      discountMinor: 1000,
      recordedByUserId: 'user-1',
    })

    const rows = (await buildSalesReportRows(todayIso(), todayIso())).filter(
      (row) => row.customerName === 'Dina Cruz',
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      storeId: 'amara',
      customerName: 'Dina Cruz',
      productName: 'Rice 25kg',
      quantity: 2,
      unitPriceMinor: 115000,
      lineTotalMinor: 230000,
      paymentType: 'Cash',
      paymentMethod: 'GCash',
      deliveryFeeMinor: 5000,
      discountMinor: 1000,
      netTotalMinor: sale.totalMinor,
      riderName: 'Jojo Ramos',
      vehiclePlate: 'Motorcycle',
      // Encoder display name; the seed suffix "(Amara staff)" never shows.
      recordedByName: 'Alice',
    })
    expect(rows[1]).toMatchObject({
      productName: 'Sugar 1kg',
      lineTotalMinor: 6500,
      deliveryFeeMinor: 0,
      discountMinor: 0,
      netTotalMinor: 0,
      recordedByName: 'Alice',
    })
  })

  it('labels sales without a customer as walk-in', async () => {
    await createSale({
      storeId: 'zeann',
      saleDate: todayIso(),
      paymentType: 'cash',
      lines: [{ productId: 'prod-4', quantity: 1, unitPriceMinor: 9500 }],
      recordedByUserId: 'user-2',
    })

    const rows = (await buildSalesReportRows(todayIso(), todayIso(), 'zeann')).filter(
      (row) => row.productName === 'Instant Coffee',
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].customerName).toBe('Walk-in')
  })

  it('filters rows to the given date range', async () => {
    await createSale({
      storeId: 'amara',
      saleDate: '2026-09-01',
      paymentType: 'cash',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 115000 }],
      recordedByUserId: 'user-1',
    })

    const inRange = await buildSalesReportRows('2026-09-01', '2026-09-02', 'amara')
    expect(inRange.some((row) => row.date === '2026-09-01')).toBe(true)

    const outOfRange = await buildSalesReportRows('2026-09-03', '2026-09-04', 'amara')
    expect(outOfRange).toHaveLength(0)
  })
})

describe('buildCreditReportRows', () => {
  beforeEach(() => resetDb())

  it('exports credits created in the range with balance math and status (DEC-052)', async () => {
    const customer = await createCustomer({ name: 'Liza Reyes' })
    await createExistingCredit({
      customerId: customer.id,
      originStoreId: 'amara',
      date: todayIso(),
      dueDate: todayIso(),
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100000 }],
      initialPaymentMinor: 25000,
      initialPaymentMethod: 'Cash',
      recordedByUserId: 'user-3',
    })

    const rows = (await buildCreditReportRows(todayIso(), todayIso())).filter(
      (row) => row.customerName === 'Liza Reyes',
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      customerName: 'Liza Reyes',
      originStoreId: 'amara',
      dueDate: todayIso(),
      originalMinor: 100000,
      paidMinor: 25000,
      balanceMinor: 75000,
      status: 'Outstanding',
    })
  })

  it('filter by origin store and excludes out-of-range credits', async () => {
    const customer = await createCustomer({ name: 'Mira Cruz' })
    await createExistingCredit({
      customerId: customer.id,
      originStoreId: 'amara',
      date: todayIso(),
      dueDate: todayIso(),
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100000 }],
      recordedByUserId: 'user-3',
    })

    const outOfRange = await buildCreditReportRows('2020-01-01', '2020-01-02')
    expect(outOfRange.some((row) => row.customerName === 'Mira Cruz')).toBe(false)

    const zeannOnly = await buildCreditReportRows(todayIso(), todayIso(), 'zeann')
    expect(zeannOnly.some((row) => row.customerName === 'Mira Cruz')).toBe(false)

    const amaraOnly = await buildCreditReportRows(todayIso(), todayIso(), 'amara')
    const mira = amaraOnly.filter((row) => row.customerName === 'Mira Cruz')
    expect(mira).toHaveLength(1)
    expect(mira[0]?.originStoreId).toBe('amara')
  })

  it('carries manually entered interest through to the export rows (DEC-059)', async () => {
    const customer = await createCustomer({ name: 'Nadia Ramos' })
    await createExistingCredit({
      customerId: customer.id,
      originStoreId: 'amara',
      date: todayIso(),
      dueDate: todayIso(),
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 100000 }],
      interestMinor: 7500,
      recordedByUserId: 'user-3',
    })

    const rows = (await buildCreditReportRows(todayIso(), todayIso())).filter(
      (row) => row.customerName === 'Nadia Ramos',
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ interestMinor: 7500, balanceMinor: 100000 })
  })

  it('exports each item line with the encoder, totals on the first line only (DEC-067)', async () => {
    const customer = await createCustomer({ name: 'Tina Lim' })
    await createExistingCredit({
      customerId: customer.id,
      originStoreId: 'amara',
      date: todayIso(),
      dueDate: todayIso(),
      lines: [
        { productId: 'prod-1', quantity: 2, unitPriceMinor: 50000 },
        { productId: 'prod-2', quantity: 3, unitPriceMinor: 10000 },
      ],
      initialPaymentMinor: 30000,
      recordedByUserId: 'user-3',
    })

    const rows = (await buildCreditReportRows(todayIso(), todayIso())).filter(
      (row) => row.customerName === 'Tina Lim',
    )

    expect(rows).toHaveLength(2)
    // Item, quantity, and price are the values saved on the credit's sale lines.
    expect(rows[0]).toMatchObject({
      productName: 'Rice 25kg',
      quantity: 2,
      unitPriceMinor: 50000,
      lineTotalMinor: 100000,
      // Encoder of the originating sale: "Owner (admin)" renders as "Owner".
      recordedByName: 'Owner',
      status: 'Outstanding',
    })
    expect(rows[1]).toMatchObject({
      productName: 'Sugar 1kg',
      quantity: 3,
      unitPriceMinor: 10000,
      lineTotalMinor: 30000,
      recordedByName: 'Owner',
      status: 'Outstanding',
    })
    // The obligation's money figures ride the first line only, so summing the
    // column equals the obligation total instead of counting it twice.
    const total = rows.reduce((sum, row) => sum + row.originalMinor, 0)
    expect(total).toBe(130000)
    expect(rows.filter((row) => row.balanceMinor > 0)).toHaveLength(1)
  })

  it('keeps a sale-less credit in the report with no item or encoder (DEC-067)', async () => {
    const customer = await createCustomer({ name: 'Rina Sol' })
    // A sale-less obligation: no sale row, so no lines and no encoder.
    getDb().credits.push({
      id: 'cred-sale-less',
      customerId: customer.id,
      originStoreId: 'amara',
      dueDate: todayIso(),
      originalAmountMinor: 42000,
      balanceMinor: 42000,
      status: 'outstanding',
      createdAt: new Date().toISOString(),
    })

    const rows = (await buildCreditReportRows(todayIso(), todayIso())).filter(
      (row) => row.customerName === 'Rina Sol',
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      productName: '—',
      quantity: 0,
      recordedByName: 'Not available',
      originalMinor: 42000,
      balanceMinor: 42000,
      status: 'Outstanding',
    })
  })
})

describe('buildExpenseReportRows', () => {
  beforeEach(() => resetDb())

  it('groups recorded expenses by date and store with fuel/repair splits (DEC-054)', async () => {
    await createExpense({
      storeId: 'amara',
      riderId: 'rider-1',
      type: 'fuel',
      amountMinor: 75000,
      recordedByUserId: 'user-1',
    })
    await createExpense({
      storeId: 'amara',
      vehicleId: 'vehicle-1',
      type: 'repair',
      amountMinor: 120000,
      recordedByUserId: 'user-1',
    })
    await createExpense({
      storeId: 'zeann',
      riderId: 'rider-3',
      type: 'fuel',
      amountMinor: 35000,
      recordedByUserId: 'user-2',
    })

    const rows = await buildExpenseReportRows(todayIso(), todayIso())
    // Seed expenses (amara + zeann) plus the three created above.
    const amara = rows.find((row) => row.date === todayIso() && row.storeId === 'amara')
    const zeann = rows.find((row) => row.date === todayIso() && row.storeId === 'zeann')
    expect(amara?.fuelMinor).toBeGreaterThanOrEqual(75000)
    expect(amara?.repairMinor).toBeGreaterThanOrEqual(120000)
    expect(amara?.totalMinor).toBe((amara?.fuelMinor ?? 0) + (amara?.repairMinor ?? 0))
    expect(zeann?.fuelMinor).toBeGreaterThanOrEqual(35000)
  })

  it('excludes expenses recorded outside the range (DEC-054)', async () => {
    const rows = await buildExpenseReportRows('2020-01-01', '2020-01-02')
    expect(rows).toHaveLength(0)
  })
})

describe('buildExpenseRecordRows', () => {
  beforeEach(() => resetDb())

  it('exports one row per expense with target, type, note, and recorder (DEC-067)', async () => {
    await createExpense({
      storeId: 'amara',
      riderId: 'rider-1',
      type: 'fuel',
      amountMinor: 75000,
      note: 'Top-up tank',
      recordedByUserId: 'user-1',
    })
    await createExpense({
      storeId: 'zeann',
      vehicleId: 'vehicle-4',
      type: 'repair',
      amountMinor: 120000,
      recordedByUserId: 'user-2',
    })

    const rows = await buildExpenseRecordRows(todayIso(), todayIso())
    const fuel = rows.find((row) => row.amountMinor === 75000)
    const repair = rows.find((row) => row.amountMinor === 120000)

    expect(fuel).toMatchObject({
      date: todayIso(),
      storeId: 'amara',
      target: 'Jojo Ramos',
      type: 'Fuel',
      note: 'Top-up tank',
      recordedByName: 'Alice',
    })
    expect(repair).toMatchObject({
      storeId: 'zeann',
      target: 'Van',
      type: 'Repair',
      recordedByName: 'Ben',
    })
  })

  it('keeps one row per record even when a date and store aggregate to one summary row', async () => {
    await createExpense({
      storeId: 'amara',
      riderId: 'rider-1',
      type: 'fuel',
      amountMinor: 11000,
      recordedByUserId: 'user-1',
    })
    await createExpense({
      storeId: 'amara',
      riderId: 'rider-1',
      type: 'fuel',
      amountMinor: 13000,
      recordedByUserId: 'user-1',
    })

    const records = await buildExpenseRecordRows(todayIso(), todayIso())
    const summaries = await buildExpenseReportRows(todayIso(), todayIso())
    const matching = records.filter((row) => row.storeId === 'amara' && row.amountMinor > 10000)

    expect(matching.length).toBeGreaterThanOrEqual(2)
    expect(
      summaries.filter((row) => row.storeId === 'amara' && row.date === todayIso()),
    ).toHaveLength(1)
  })

  it('excludes expenses recorded outside the range', async () => {
    const rows = await buildExpenseRecordRows('2020-01-01', '2020-01-02')
    expect(rows).toHaveLength(0)
  })
})
