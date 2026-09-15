import { listCustomers, listProducts, listRiders, listSales, listVehicles } from '@/services'
import type { StoreId } from '@/domain'
import type { ReportExcelRow } from '@/lib/exportReportExcel'

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
