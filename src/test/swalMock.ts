import type { Mock } from 'vitest'
import { vi } from 'vitest'

// SweetAlert2 test double (DEC-038): the app fires popups for action feedback;
// the real library's jsdom rendering is flaky, so every call resolves
// confirmed (confirm flows proceed) and records its options for assertions.

export type FireCall = Record<string, unknown>

const calls: FireCall[] = []

export function __swalCalls(): FireCall[] {
  return calls
}

export function __lastSwal(): FireCall | undefined {
  return calls[calls.length - 1]
}

/** Awaits until a popup whose title matches had been fired (or times out). */
export async function __awaitSwal(
  title: string | RegExp,
  timeout = 1000,
): Promise<FireCall | undefined> {
  const start = Date.now()
  for (;;) {
    const match = calls.find((call) =>
      typeof title === 'string' ? call.title === title : title.test(String(call.title)),
    )
    if (match) {
      return match
    }
    if (Date.now() - start > timeout) {
      throw new Error(`swal2 fire not called with title: ${String(title)}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

export function __resetSwalCalls(): void {
  calls.length = 0
}

// Confirm flows (both confirm- and deny-styled destructive buttons) resolve
// as confirmed: isConfirmed=true and deny=true.
export const fire: Mock = vi.fn(async (options: FireCall = {}) => {
  calls.push(options)
  return { isConfirmed: true, isDenied: true, isDismissed: false }
})

export const update = vi.fn(() => undefined)
export const showLoading = vi.fn(() => undefined)
export const close = vi.fn(() => undefined)

export default {
  fire,
  update,
  showLoading,
  close,
  mixin: vi.fn(() => ({ fire })),
}
