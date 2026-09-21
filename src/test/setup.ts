import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// SweetAlert2 is mocked for every test (DEC-038): popups resolve confirmed —
// confirm flows proceed without clicks — and record their options for
// assertions via swalMock helpers. See swalMock.ts.
vi.mock('sweetalert2', async () => await import('./swalMock'))

export { __resetSwalCalls } from './swalMock'
