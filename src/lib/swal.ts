import Swal, { type SweetAlertResult } from 'sweetalert2'

// SweetAlert2 wrapper (DEC-038): one feedback system for every CRUD/action
// outcome. Success and failure are modal popups (Q1=b); confirmations replace
// the in-app ConfirmDialog (Q2=a). Page load/error/empty states and
// client-side field validation stay inline as before (Q3).

interface ConfirmOptions {
  title: string
  text?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Destructive confirmations render the danger (deny-style) button. */
  danger?: boolean
}

interface BusyOptions {
  title: string
  text?: string
}

/**
 * Confirmation dialog. Resolves true when the caller confirmed; false on
 * cancel/dismiss. Fires nothing on dismiss.
 */
export async function confirmAction({
  title,
  text,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
}: ConfirmOptions): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmLabel,
    cancelButtonText: cancelLabel,
    reverseButtons: true,
    ...(danger
      ? {
          showConfirmButton: false,
          showDenyButton: true as const,
          denyButtonText: confirmLabel,
        }
      : {}),
  })
  return danger ? result.isDenied : result.isConfirmed
}

/** Success popup. */
export async function notifySuccess(title: string, text?: string): Promise<SweetAlertResult> {
  return Swal.fire({ title, text, icon: 'success', confirmButtonText: 'OK' })
}

/** Failure popup. Keep copy user-safe — never raw database internals. */
export async function notifyError(title: string, text?: string): Promise<SweetAlertResult> {
  return Swal.fire({ title, text, icon: 'error', confirmButtonText: 'OK' })
}

/** Informational popup (non-terminal action feedback). */
export async function notifyInfo(title: string, text?: string): Promise<SweetAlertResult> {
  return Swal.fire({ title, text, icon: 'info', confirmButtonText: 'OK' })
}

/**
 * Switch the open confirm dialog to a loading state while the awaited
 * mutation runs; callers pair this with `endBusy()`.
 */
export function showBusy({ title, text }: BusyOptions): void {
  Swal.update({
    title,
    text,
    showDenyButton: false,
    showCancelButton: false,
  })
  Swal.showLoading()
}

export function endBusy(): void {
  Swal.close()
}
