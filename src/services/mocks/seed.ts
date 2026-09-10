import { addDays } from '@/lib/dates'
import type {
  CreditObligation,
  Customer,
  Payment,
  PaymentTerms,
  Product,
  ReceivingRecord,
  Sale,
  StockLevel,
  User,
} from '@/domain'
import type { MockDatabase } from './db'

export function createSeedData(): MockDatabase {
  const today = new Date().toISOString()
  const yesterday = addDays(today, -1)

  const customers: Customer[] = [
    {
      id: 'cust-1',
      name: 'Maria Santos',
      contact: '0917 000 0001',
      createdAt: addDays(today, -30),
    },
    { id: 'cust-2', name: 'Juan Dela Cruz', createdAt: addDays(today, -20) },
    {
      id: 'cust-3',
      name: 'Ana Reyes',
      contact: '0917 000 0003',
      createdAt: addDays(today, -10),
    },
  ]

  const products: Product[] = [
    { id: 'prod-1', name: 'Rice 25kg', status: 'active', createdAt: addDays(today, -30) },
    { id: 'prod-2', name: 'Sugar 1kg', status: 'active', createdAt: addDays(today, -30) },
    { id: 'prod-4', name: 'Instant Coffee', status: 'active', createdAt: addDays(today, -25) },
    {
      id: 'prod-3',
      name: 'Cooking Oil 1L',
      status: 'pending',
      createdByUserId: 'user-1',
      createdAt: yesterday,
    },
  ]

  const stock: StockLevel[] = [
    { storeId: 'amara', productId: 'prod-1', quantity: 20 },
    { storeId: 'amara', productId: 'prod-2', quantity: 50 },
    { storeId: 'amara', productId: 'prod-4', quantity: 30 },
    { storeId: 'zeann', productId: 'prod-1', quantity: 12 },
    { storeId: 'zeann', productId: 'prod-2', quantity: 40 },
    { storeId: 'zeann', productId: 'prod-4', quantity: 25 },
  ]

  const users: User[] = [
    { id: 'user-1', name: 'Alice (Amara staff)', role: 'staff', storeId: 'amara' },
    { id: 'user-2', name: 'Ben (Zeann staff)', role: 'staff', storeId: 'zeann' },
    { id: 'user-3', name: 'Owner (admin)', role: 'admin' },
  ]

  const terms: PaymentTerms[] = [
    { id: 'terms-7', label: '7 days' },
    { id: 'terms-15', label: '15 days' },
    { id: 'terms-30', label: '30 days' },
  ]

  const receiving: ReceivingRecord[] = [
    {
      id: 'recv-1',
      storeId: 'amara',
      productId: 'prod-1',
      quantity: 20,
      supplier: 'Central Supply',
      costPriceMinor: 110000,
      receivedAt: today,
    },
    {
      id: 'recv-2',
      storeId: 'zeann',
      productId: 'prod-2',
      quantity: 40,
      supplier: 'Sweet Depot',
      costPriceMinor: 5500,
      receivedAt: today,
    },
    {
      id: 'recv-3',
      storeId: 'amara',
      productId: 'prod-2',
      quantity: 50,
      supplier: 'Sweet Depot',
      costPriceMinor: 5000,
      receivedAt: addDays(today, -3),
    },
  ]

  const sales: Sale[] = [
    {
      id: 'sale-1',
      storeId: 'amara',
      customerId: 'cust-1',
      paymentType: 'cash',
      lines: [{ productId: 'prod-1', quantity: 2, unitPriceMinor: 115000 }],
      totalMinor: 230000,
      createdAt: today,
    },
    {
      id: 'sale-2',
      storeId: 'zeann',
      customerId: 'cust-2',
      paymentType: 'charge',
      lines: [{ productId: 'prod-2', quantity: 3, unitPriceMinor: 6500 }],
      totalMinor: 19500,
      createdAt: today,
    },
    {
      id: 'sale-3',
      storeId: 'amara',
      paymentType: 'cash',
      lines: [{ productId: 'prod-4', quantity: 1, unitPriceMinor: 9500 }],
      totalMinor: 9500,
      createdAt: today,
    },
    {
      id: 'sale-4',
      storeId: 'zeann',
      customerId: 'cust-1',
      paymentType: 'cash',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 120000 }],
      totalMinor: 120000,
      createdAt: yesterday,
    },
  ]

  const credits: CreditObligation[] = [
    {
      id: 'cred-1',
      customerId: 'cust-2',
      originStoreId: 'zeann',
      saleId: 'sale-2',
      termsId: 'terms-15',
      dueDate: addDays(today, 15),
      originalAmountMinor: 19500,
      balanceMinor: 19500,
      status: 'outstanding',
      createdAt: today,
    },
    {
      id: 'cred-2',
      customerId: 'cust-1',
      originStoreId: 'amara',
      termsId: 'terms-30',
      dueDate: addDays(today, 30),
      originalAmountMinor: 50000,
      balanceMinor: 20000,
      status: 'outstanding',
      createdAt: addDays(today, -5),
    },
    {
      id: 'cred-3',
      customerId: 'cust-3',
      originStoreId: 'amara',
      termsId: 'terms-7',
      dueDate: addDays(today, -2),
      originalAmountMinor: 12000,
      balanceMinor: 0,
      status: 'settled',
      createdAt: addDays(today, -9),
    },
  ]

  const payments: Payment[] = [
    {
      id: 'pay-1',
      creditId: 'cred-2',
      storeId: 'zeann',
      amountMinor: 20000,
      paidAt: addDays(today, -2),
    },
    {
      id: 'pay-2',
      creditId: 'cred-2',
      storeId: 'amara',
      amountMinor: 10000,
      paidAt: addDays(today, -1),
    },
    {
      id: 'pay-3',
      creditId: 'cred-3',
      storeId: 'amara',
      amountMinor: 12000,
      paidAt: addDays(today, -2),
    },
  ]

  return { customers, products, stock, users, terms, receiving, sales, credits, payments }
}
