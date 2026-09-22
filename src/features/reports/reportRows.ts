import {
  listCredits,
  listCustomers,
  listExpenses,
  listProducts,
  listRiders,
  listSales,
  listVehicles,
} from '@/services'
import type { StoreId } from '@/domain'
import { toDateOnly } from '@/lib/dates'
import type { ReportExcelRow } from '@/lib/exportReportExcel'

/**
 * One row per credit obligation created within the range (Option A): both
 * outstanding and settled records with their balance math, so the report
 * shows the partial-payment history. Voided credits are already excluded by
 * listCredits (DEC-050); encoded legacy credits ride the same path as any
 * other obligation — they ARE credit records, only never sales rows.
 */
export interface CreditExcelRow {
  customerName: string
  originStoreId: StoreId
  createdDate: string
  dueDate: string
  originalMinor: number
  paidMinor: number
  balanceMinor: number
  status: string
}

function inDateRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to
}

export async function buildCreditReportRows(
  from: string,
  to: string,
  storeId?: StoreId,
): Promise<CreditExcelRow[]> {
  const [credits, customers] = await Promise.all([
    listCredits(storeId ? { originStoreId: storeId } : {}),
    listCustomers(),
  ])
  const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]))

  return credits
    .filter((credit) => inDateRange(toDateOnly(new Date(credit.createdAt)), from, to))
    .map((credit) => ({
      customerName: customerNames.get(credit.customerId) ?? 'Unknown customer',
      originStoreId: credit.originStoreId,
      createdDate: toDateOnly(new Date(credit.createdAt)),
      dueDate: credit.dueDate,
      originalMinor: credit.originalAmountMinor,
      paidMinor: credit.originalAmountMinor - credit.balanceMinor,
      balanceMinor: credit.balanceMinor,
      status: credit.status === 'settled' ? 'Settled' : 'Outstanding',
    }))
}

/**
 * One row per recording date per store (DEC-054): the fuel/repair/total of the
 * recorded expenses whose recording date falls in the range. Expenses carry no
 * expense-date field, so each record counts on its recording date.
 */
export interface ExpenseExcelRow {
  date: string
  storeId: StoreId
  fuelMinor: number
  repairMinor: number
  totalMinor: number
}

export async function buildExpenseReportRows(from: string, to: string): Promise<ExpenseExcelRow[]> {
  const expenses = await listExpenses()
  const byDateStore = new Map<string, ExpenseExcelRow>()
  for (const expense of expenses) {
    const date = toDateOnly(new Date(expense.createdAt))
    if (!inDateRange(date, from, to)) {
      continue
    }
    const key = `${date}|${expense.storeId}`
    const entry = byDateStore.get(key) ?? {
      date,
      storeId: expense.storeId,
      fuelMinor: 0,
      repairMinor: 0,
      totalMinor: 0,
    }
    if (expense.type === 'fuel') {
      entry.fuelMinor += expense.amountMinor
    } else {
      entry.repairMinor += expense.amountMinor
    }
    entry.totalMinor += expense.amountMinor
    byDateStore.set(key, entry)
  }
  return [...byDateStore.values()].sort((a, b) =>
    a.date === b.date ? (a.storeId < b.storeId ? -1 : 1) : a.date < b.date ? -1 : 1,
  )
}

/**
 * Expands the sales within a date range into one row per sale line for the
 * Excel export. Per-sale figures (delivery fee, discount, net) are attached
 * to the first line only so summing the columns does not double-count them.
 */
export async function buildSalesReportRows(
  from: string,
  to: string,
  storeId?: StoreId,
): Promise<ReportExcelRow[]> {
  const [sales, customers, products, riders, vehicles] = await Promise.all([
    listSales({ storeId, from, to }),
    listCustomers(),
    listProducts(),
    listRiders(),
    listVehicles(),
  ])

  const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]))
  const productNames = new Map(products.map((product) => [product.id, product.name]))
  const riderNames = new Map(riders.map((rider) => [rider.id, rider.name]))
  const vehicleLabels = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.label]))

  const rows: ReportExcelRow[] = []
  for (const sale of sales) {
    const customerName = sale.customerId ? (customerNames.get(sale.customerId) ?? '') : 'Walk-in'
    const riderName = sale.delivery?.riderId ? (riderNames.get(sale.delivery.riderId) ?? '') : ''
    const vehiclePlate = sale.delivery?.vehicleId
      ? (vehicleLabels.get(sale.delivery.vehicleId) ?? '')
      : ''

    sale.lines.forEach((line, index) => {
      const first = index === 0
      rows.push({
        date: sale.saleDate,
        storeId: sale.storeId,
        customerName,
        productName: productNames.get(line.productId) ?? '',
        quantity: line.quantity,
        unitPriceMinor: line.unitPriceMinor,
        lineTotalMinor: line.quantity * line.unitPriceMinor,
        paymentType: sale.paymentType === 'charge' ? 'Charge' : 'Cash',
        paymentMethod: sale.paymentMethod?.trim() || '—',
        deliveryFeeMinor: first ? (sale.delivery?.feeMinor ?? 0) : 0,
        discountMinor: first ? (sale.discountMinor ?? 0) : 0,
        netTotalMinor: first ? sale.totalMinor : 0,
        riderName,
        vehiclePlate,
      })
    })
  }
  return rows
}
