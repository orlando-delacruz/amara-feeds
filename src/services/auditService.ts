import type { AuditEvent, NewAuditEventInput, StoreId, User, UserId } from '@/domain'
import { isSameDate } from '@/lib/dates'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'

export const AUDIT_ACTION_LABELS: Record<AuditEvent['action'], string> = {
  'sale.recorded': 'Sale recorded',
  'payment.recorded': 'Payment recorded',
  'receiving.recorded': 'Stock received',
  'product.submitted': 'Product submitted',
  'product.approved': 'Product approved',
  'product.rejected': 'Product rejected',
  'rider.added': 'Rider added',
  'rider.status-changed': 'Rider status changed',
  'expense.recorded': 'Expense recorded',
  'stock.updated': 'Stock adjusted',
  'stock.deleted': 'Stock deleted',
}

/** Frontend-only session log. Derived seed history comes from stored records. */
export async function logAuditEvent(input: NewAuditEventInput): Promise<AuditEvent> {
  const event: AuditEvent = {
    id: nextId('audit'),
    ...input,
    createdAt: new Date().toISOString(),
  }
  getDb().auditLog.push(event)
  return { ...event }
}

function roleOf(users: User[], userId: UserId): User['role'] {
  return users.find((user) => user.id === userId)?.role ?? 'staff'
}

/**
 * Builds the business-wide trail from stored records plus the session log.
 * Frontend-only: derives history from the mock database, no backend involved.
 */
export async function listAuditEvents(
  filter: { date?: string; storeId?: StoreId } = {},
): Promise<AuditEvent[]> {
  const db = getDb()
  const productNames = new Map(db.products.map((product) => [product.id, product.name]))

  const derived: AuditEvent[] = [
    ...db.sales.map((sale): AuditEvent => ({
      id: `audit-${sale.id}`,
      action: 'sale.recorded',
      actorUserId: sale.recordedByUserId,
      actorRole: roleOf(db.users, sale.recordedByUserId),
      storeId: sale.storeId,
      subject: `Sale at ${sale.storeId === 'amara' ? 'Amara' : 'Zeann'}`,
      detail: `${sale.lines.length} item${sale.lines.length === 1 ? '' : 's'} · ${sale.paymentType === 'charge' ? 'charge' : 'cash'}`,
      createdAt: sale.createdAt,
    })),
    ...db.payments.map((payment): AuditEvent => ({
      id: `audit-${payment.id}`,
      action: 'payment.recorded',
      actorUserId: payment.recordedByUserId,
      actorRole: roleOf(db.users, payment.recordedByUserId),
      storeId: payment.storeId,
      subject: `Payment at ${payment.storeId === 'amara' ? 'Amara' : 'Zeann'}`,
      detail: `Via ${payment.method}`,
      createdAt: payment.paidAt,
    })),
    ...db.receiving.map((record): AuditEvent => ({
      id: `audit-${record.id}`,
      action: 'receiving.recorded',
      actorUserId: record.recordedByUserId,
      actorRole: roleOf(db.users, record.recordedByUserId),
      storeId: record.storeId,
      subject: productNames.get(record.productId) ?? 'Item',
      detail: `${record.quantity} pcs from ${record.supplier}`,
      createdAt: record.receivedAt,
    })),
    ...db.products
      .filter((product) => product.createdByUserId)
      .map((product): AuditEvent => ({
        id: `audit-${product.id}-submitted`,
        action: 'product.submitted',
        actorUserId: product.createdByUserId ?? '',
        actorRole: roleOf(db.users, product.createdByUserId ?? ''),
        subject: product.name,
        detail: product.status === 'pending' ? 'Awaiting admin approval' : 'Approved and active',
        createdAt: product.createdAt,
      })),
    ...db.riders
      .filter((rider) => rider.createdByUserId)
      .map((rider): AuditEvent => ({
        id: `audit-${rider.id}`,
        action: 'rider.added',
        actorUserId: rider.createdByUserId ?? '',
        actorRole: roleOf(db.users, rider.createdByUserId ?? ''),
        storeId: rider.storeId,
        subject: rider.name,
        detail: rider.active ? 'Active rider' : 'Inactive rider',
        createdAt: rider.createdAt,
      })),
    ...db.expenses.map((expense): AuditEvent => ({
      id: `audit-${expense.id}`,
      action: 'expense.recorded',
      actorUserId: expense.recordedByUserId,
      actorRole: roleOf(db.users, expense.recordedByUserId),
      storeId: expense.storeId,
      subject: `${expense.type === 'fuel' ? 'Fuel' : 'Repair'} expense`,
      detail: expense.note ?? undefined,
      createdAt: expense.createdAt,
    })),
    ...db.auditLog.map((event) => ({ ...event })),
  ]

  const { date, storeId } = filter
  const scoped = derived.filter(
    (event) =>
      (!date || isSameDate(event.createdAt, date)) && (!storeId || event.storeId === storeId),
  )
  return scoped.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
}

/**
 * Staff see their own actions plus admin actions connected to their account
 * (e.g. an approval of their pending product request). Admins see everything.
 */
export async function listAuditEventsForUser(
  user: User,
  filter: { date?: string; storeId?: StoreId } = {},
): Promise<AuditEvent[]> {
  const events = await listAuditEvents(filter)
  if (user.role === 'admin') {
    return events
  }
  return events.filter((event) => event.actorUserId === user.id || event.relatedUserId === user.id)
}
