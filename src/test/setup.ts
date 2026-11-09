import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/dom'
import { vi } from 'vitest'

// SweetAlert2 is mocked for every test (DEC-038): popups resolve confirmed —
// confirm flows proceed without clicks — and record their options for
// assertions via swalMock helpers. See swalMock.ts.
vi.mock('sweetalert2', async () => await import('./swalMock'))

// Default waitFor timeout is 1000ms, which several findBy* assertions after an
// async navigation exceeded under parallel load — they failed intermittently
// while the code under test was fine. Set once here instead of repeating
// `{ timeout: 5000 }` at every call site; pairs with testTimeout in
// vite.config.ts (the whole test, not just one poll).
configure({ asyncUtilTimeout: 10000 })

// jsdom has no ResizeObserver, and MoneyText (which every money figure renders
// through) constructs one in an effect. Whether that effect had flushed before
// an assertion varied with worker timing, so the dashboard suite failed only
// sometimes — and failed deterministically when run alone. A no-op stub is the
// standard jsdom fix and leaves production behaviour untouched.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// jsdom does not implement window.scrollTo (calling it logs "Not implemented"
// noise); the app's ScrollManager calls it on every route change, so stub a
// no-op. Tests that assert scroll behaviour replace it with a mock.
window.scrollTo = () => {}

export { __resetSwalCalls } from './swalMock'