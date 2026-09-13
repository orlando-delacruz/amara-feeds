import type { StoreId } from './store'
import type { UserId } from './ids'
import type { UserRole } from './user'

export type AuditId = string

export type AuditAction =
  | 'sale.recorded'
  | 'payment.recorded'
  | 'receiving.recorded'
  | 'product.submitted'
  | 'product.approved'
  | 'product.rejected'
  | 'rider.added'
  | 'rider.status-changed'
  | 'expense.recorded'

export interface AuditEvent {
  id: AuditId
  action: AuditAction
  /** Staff or admin who performed the action. */
  actorUserId: UserId
  actorRole: UserRole
  /** Store the action belongs to, when it is store-scoped. */
  storeId?: StoreId
  /**
   * Staff account an admin action connects to — e.g. the submitter of an
   * approved product. Drives the staff visibility rule: a staff member sees
   * their own actions plus admin actions carrying their user id here.
   */
  relatedUserId?: UserId
  /** Short human-readable subject, e.g. product or rider name. */
  subject: string
  detail?: string
  createdAt: string
}

export interface NewAuditEventInput {
  action: AuditAction
  actorUserId: UserId
  actorRole: UserRole
  storeId?: StoreId
  relatedUserId?: UserId
  subject: string
  detail?: string
}
