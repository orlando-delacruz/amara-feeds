import { addDays, toDateOnly } from '@/lib/dates'
import type {
  CreditObligation,
  Customer,
  Expense,
  Payment,
  PaymentTerms,
  Product,
  ReceivingRecord,
  Rider,
  Sale,
  StockLevel,
  User,
  Vehicle,
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
      address: '123 Mabini Street, Barangay Poblacion',
      createdAt: addDays(today, -30),
    },
    {
      id: 'cust-2',
      name: 'Juan Dela Cruz',
      address: '45 Rizal Avenue, Barangay San Isidro',
      createdAt: addDays(today, -20),
    },
    {
      id: 'cust-3',
      name: 'Ana Reyes',
      contact: '0917 000 0003',
      address: '78 Quezon Boulevard, Barangay Bagong Silang',
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
    {
      id: 'user-1',
      name: 'Alice (Amara staff)',
      role: 'staff',
      storeId: 'amara',
      username: 'alice',
      password: 'alice123',
      active: true,
    },
    {
      id: 'user-2',
      name: 'Ben (Zeann staff)',
      role: 'staff',
      storeId: 'zeann',
      username: 'ben',
      password: 'ben123',
      active: true,
    },
    {
      id: 'user-3',
      name: 'Owner (admin)',
      role: 'admin',
      username: 'owner',
      password: 'admin123',
      active: true,
    },
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
      sellingPriceMinor: 115000,
      riderId: 'rider-1',
      vehicleId: 'vehicle-1',
      recordedByUserId: 'user-1',
      receivedAt: today,
    },
    {
      id: 'recv-2',
      storeId: 'zeann',
      productId: 'prod-2',
      quantity: 40,
      supplier: 'Sweet Depot',
      costPriceMinor: 5500,
      sellingPriceMinor: 6500,
      riderId: 'rider-3',
      vehicleId: 'vehicle-3',
      recordedByUserId: 'user-2',
      receivedAt: today,
    },
    {
      id: 'recv-3',
      storeId: 'amara',
      productId: 'prod-2',
      quantity: 50,
      supplier: 'Sweet Depot',
      costPriceMinor: 5000,
      sellingPriceMinor: 6500,
      riderId: 'rider-2',
      vehicleId: 'vehicle-2',
      recordedByUserId: 'user-1',
      receivedAt: addDays(today, -3),
    },
    {
      id: 'recv-4',
      storeId: 'zeann',
      productId: 'prod-1',
      quantity: 12,
      supplier: 'Central Supply',
      costPriceMinor: 110000,
      sellingPriceMinor: 120000,
      riderId: 'rider-3',
      vehicleId: 'vehicle-3',
      recordedByUserId: 'user-2',
      receivedAt: today,
    },
    {
      id: 'recv-5',
      storeId: 'amara',
      productId: 'prod-4',
      quantity: 30,
      supplier: 'Coffee Traders',
      costPriceMinor: 8000,
      sellingPriceMinor: 9500,
      riderId: 'rider-1',
      vehicleId: 'vehicle-1',
      recordedByUserId: 'user-1',
      receivedAt: today,
    },
    {
      id: 'recv-6',
      storeId: 'zeann',
      productId: 'prod-4',
      quantity: 25,
      supplier: 'Coffee Traders',
      costPriceMinor: 8000,
      sellingPriceMinor: 9500,
      riderId: 'rider-3',
      vehicleId: 'vehicle-3',
      recordedByUserId: 'user-2',
      receivedAt: today,
    },
  ]

  const sales: Sale[] = [
    {
      id: 'sale-1',
      storeId: 'amara',
      saleDate: toDateOnly(new Date(today)),
      customerId: 'cust-1',
      paymentType: 'cash',
      paymentMethod: 'Cash',
      lines: [{ productId: 'prod-1', quantity: 2, unitPriceMinor: 115000 }],
      totalMinor: 230000,
      recordedByUserId: 'user-1',
      createdAt: today,
    },
    {
      id: 'sale-2',
      storeId: 'zeann',
      saleDate: toDateOnly(new Date(today)),
      customerId: 'cust-2',
      paymentType: 'charge',
      paymentMethod: 'GCash',
      lines: [{ productId: 'prod-2', quantity: 3, unitPriceMinor: 6500 }],
      totalMinor: 19500,
      recordedByUserId: 'user-2',
      createdAt: today,
    },
    {
      id: 'sale-3',
      storeId: 'amara',
      saleDate: toDateOnly(new Date(today)),
      paymentType: 'cash',
      paymentMethod: 'Cash',
      lines: [{ productId: 'prod-4', quantity: 1, unitPriceMinor: 9500 }],
      totalMinor: 9500,
      recordedByUserId: 'user-1',
      createdAt: today,
    },
    {
      id: 'sale-4',
      storeId: 'zeann',
      saleDate: toDateOnly(new Date(yesterday)),
      customerId: 'cust-1',
      paymentType: 'cash',
      paymentMethod: 'Maya',
      lines: [{ productId: 'prod-1', quantity: 1, unitPriceMinor: 120000 }],
      totalMinor: 120000,
      recordedByUserId: 'user-2',
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
      method: 'GCash',
      recordedByUserId: 'user-2',
      paidAt: addDays(today, -2),
    },
    {
      id: 'pay-2',
      creditId: 'cred-2',
      storeId: 'amara',
      amountMinor: 10000,
      method: 'Cash',
      recordedByUserId: 'user-1',
      paidAt: addDays(today, -1),
    },
    {
      id: 'pay-3',
      creditId: 'cred-3',
      storeId: 'amara',
      amountMinor: 12000,
      method: 'Bank Transfer',
      recordedByUserId: 'user-1',
      paidAt: addDays(today, -2),
    },
  ]

  const riders: Rider[] = [
    {
      id: 'rider-1',
      name: 'Jojo Ramos',
      storeId: 'amara',
      active: true,
      createdAt: addDays(today, -20),
    },
    {
      id: 'rider-2',
      name: 'Ramon Cruz',
      storeId: 'amara',
      active: true,
      createdAt: addDays(today, -15),
    },
    {
      id: 'rider-3',
      name: 'Paolo Lim',
      storeId: 'zeann',
      active: true,
      createdAt: addDays(today, -20),
    },
  ]

  const vehicles: Vehicle[] = [
    {
      id: 'vehicle-1',
      label: 'Motorcycle',
      storeId: 'amara',
      active: true,
      createdAt: addDays(today, -20),
    },
    {
      id: 'vehicle-2',
      label: 'Tricycle',
      storeId: 'amara',
      active: true,
      createdAt: addDays(today, -20),
    },
    {
      id: 'vehicle-3',
      label: 'Motorcycle',
      storeId: 'zeann',
      active: true,
      createdAt: addDays(today, -20),
    },
    {
      id: 'vehicle-4',
      label: 'Van',
      storeId: 'zeann',
      active: true,
      createdAt: addDays(today, -10),
    },
  ]

  const expenses: Expense[] = [
    {
      id: 'exp-1',
      storeId: 'amara',
      riderId: 'rider-1',
      type: 'fuel',
      amountMinor: 50000,
      note: 'Weekly fuel for Amara deliveries',
      recordedByUserId: 'user-1',
      createdAt: addDays(today, -1),
    },
    {
      id: 'exp-2',
      storeId: 'amara',
      vehicleId: 'vehicle-2',
      type: 'repair',
      amountMinor: 120000,
      note: 'Tricycle tire replacement',
      recordedByUserId: 'user-1',
      createdAt: addDays(today, -2),
    },
    {
      id: 'exp-3',
      storeId: 'zeann',
      riderId: 'rider-3',
      vehicleId: 'vehicle-3',
      type: 'fuel',
      amountMinor: 35000,
      note: 'Zeann store fuel allowance',
      recordedByUserId: 'user-2',
      createdAt: addDays(today, -1),
    },
  ]

  return {
    customers,
    products,
    stock,
    users,
    terms,
    receiving,
    sales,
    credits,
    payments,
    riders,
    vehicles,
    expenses,
    auditLog: [],
  }
}
