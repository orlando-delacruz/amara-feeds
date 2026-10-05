import {
  listCreditRecords,
  listCustomers,
  listExpenses,
  listProducts,
  listRiders,
  listSales,
  listUsers,
  listVehicles,
} from '@/services'
import type { StoreId } from '@/domain'
import { toDateOnly } from '@/lib/dates'
import { getDisplayName } from '@/features/session/displayName'
import type { ReportExcelRow } from '@/lib/exportReportExcel'

/** Shown when a referenced name cannot be resolved for a record. */
const NOT_AVAILABLE = 'Not available'

/** Shown where a record carries no value for the column. */
const NONE = '—'

/** Recorded-by display names, resolved at build time so the file reads
 * standalone (the DEC-060 receiving-export pattern). */
function recorderNames(users: Array<{ id: string; name: string }>): Map<string, string> {
  return new Map(users.map((user) => [user.id, getDisplayName(user.name)]))
}

function inDateRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to
}

function byDateThenStore(
  a: { date: string; storeId: StoreId },
  b: { date: string; storeId: StoreId },
) {
  if (a.date !== b.date) {
    return a.date < b.date ? -1 : 1
  }
  if (a.storeId === b.storeId) {
    return 0
  }
  return a.storeId < b.storeId ? -1 : 1
}

/**
 * One row per item line of a credit obligation created within the range
 * (Option A, revised DEC-067): both outstanding and settled records with their
 * balance math, so the report shows the partial-payment history. Voided credits
 * are already excluded by listCreditRecords (DEC-050); encoded legacy credits
 * ride the same path as any other obligation — they ARE credit records, only
 * never sales rows.
 *
 * Item, quantity, and price are the values actually saved on the originating
 * sale's lines — nothing is re-derived. The obligation's money figures
 * (original, paid, balance, interest) are attached to the FIRST line only,
 * exactly as the sales builder does with delivery fee, discount, and net, so
 * summing those columns never counts an obligation twice; Status repeats on
 * every line because it is a label, not a summable amount.
 *
 * Sale-less obligations (seed rows) carry no lines and no encoder: they are
 * still exported, as a single row with no item values, rather than dropped.
 */
export interface CreditExcelRow {
  customerName: string
  originStoreId: StoreId
  createdDate: string
  dueDate: string
  /** Encoder of the originating sale (sales.recorded_by_user_id). */
  recordedByName: string
  productName: string
  quantity: number
  unitPriceMinor: number
  lineTotalMinor: number
  originalMinor: number
  paidMinor: number
  balanceMinor: number
  status: string
  /** Manually entered interest, if any (display-only, DEC-059). */
  interestMinor?: number
}

export async function buildCreditReportRows(
  from: string,
  to: string,
  storeId?: StoreId,
): Promise<CreditExcelRow[]> {
  const [credits, customers, users] = await Promise.all([
    listCreditRecords(storeId ? { originStoreId: storeId } : {}),
    listCustomers(),
    listUsers(),
  ])
  const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]))
  const userNames = recorderNames(users)

  const rows: CreditExcelRow[] = []
  for (const credit of credits) {
    const createdDate = toDateOnly(new Date(credit.createdAt))
    if (!inDateRange(createdDate, from, to)) {
      continue
    }
    const shared = {
      customerName: customerNames.get(credit.customerId) ?? 'Unknown customer',
      originStoreId: credit.originStoreId,
      createdDate,
      dueDate: credit.dueDate,
      recordedByName:
        (credit.recordedByUserId && userNames.get(credit.recordedByUserId)) || NOT_AVAILABLE,
      status: credit.status === 'settled' ? 'Settled' : 'Outstanding',
    }
    const money = {
      originalMinor: credit.originalAmountMinor,
      paidMinor: credit.originalAmountMinor - credit.balanceMinor,
      balanceMinor: credit.balanceMinor,
    }
    const lines = credit.items.length > 0 ? credit.items : [undefined]
    lines.forEach((line, index) => {
      const first = index === 0
      rows.push({
        ...shared,
        productName: line?.productName ?? NONE,
        quantity: line?.quantity ?? 0,
        unitPriceMinor: line?.unitPriceMinor ?? 0,
        lineTotalMinor: line ? line.quantity * line.unitPriceMinor : 0,
        originalMinor: first ? money.originalMinor : 0,
        paidMinor: first ? money.paidMinor : 0,
        balanceMinor: first ? money.balanceMinor : 0,
        ...(first && credit.interestMinor !== undefined
          ? { interestMinor: credit.interestMinor }
          : {}),
      })
    })
  }
  return rows
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
  return [...byDateStore.values()].sort(byDateThenStore)
}

/**
 * One row per recorded expense (DEC-067): the per-record detail the aggregated
 * Expenses sheet cannot carry — what it was charged to, how much, the note, and
 * who recorded it. Mirrors the expense history on the Expenses page.
 */
export interface ExpenseRecordExcelRow {
  date: string
  storeId: StoreId
  /** Rider or vehicle the expense was charged to. */
  target: string
  type: string
  amountMinor: number
  note: string
  recordedByName: string
}

export async function buildExpenseRecordRows(
  from: string,
  to: string,
): Promise<ExpenseRecordExcelRow[]> {
  const [expenses, riders, vehicles, users] = await Promise.all([
    listExpenses(),
    listRiders(),
    listVehicles(),
    listUsers(),
  ])
  const riderNames = new Map(riders.map((rider) => [rider.id, rider.name]))
  const vehicleLabels = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.label]))
  const userNames = recorderNames(users)

  return expenses
    .filter((expense) => inDateRange(toDateOnly(new Date(expense.createdAt)), from, to))
    .map((expense) => ({
      date: toDateOnly(new Date(expense.createdAt)),
      storeId: expense.storeId,
      target: expense.riderId
        ? (riderNames.get(expense.riderId) ?? NOT_AVAILABLE)
        : expense.vehicleId
          ? (vehicleLabels.get(expense.vehicleId) ?? NOT_AVAILABLE)
          : NONE,
      type: expense.type === 'fuel' ? 'Fuel' : 'Repair',
      amountMinor: expense.amountMinor,
      note: expense.note ?? '',
      recordedByName: userNames.get(expense.recordedByUserId) ?? NOT_AVAILABLE,
    }))
    .sort(byDateThenStore)
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
  const [sales, customers, products, riders, vehicles, users] = await Promise.all([
    listSales({ storeId, from, to }),
    listCustomers(),
    listProducts(),
    listRiders(),
    listVehicles(),
    listUsers(),
  ])

  const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]))
  const productNames = new Map(products.map((product) => [product.id, product.name]))
  const riderNames = new Map(riders.map((rider) => [rider.id, rider.name]))
  const vehicleLabels = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.label]))
  const userNames = recorderNames(users)

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
        recordedByName: userNames.get(sale.recordedByUserId) ?? NOT_AVAILABLE,
      })
    })
  }
  return rows
}
