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
import { resetIdCounter } from './ids'
import { createSeedData } from './seed'

export interface MockDatabase {
  customers: Customer[]
  products: Product[]
  stock: StockLevel[]
  receiving: ReceivingRecord[]
  sales: Sale[]
  credits: CreditObligation[]
  payments: Payment[]
  terms: PaymentTerms[]
  users: User[]
}

let db: MockDatabase = createSeedData()

export function getDb(): MockDatabase {
  return db
}

export function resetDb(): MockDatabase {
  resetIdCounter()
  db = createSeedData()
  return db
}
