import type { ReactNode } from 'react'

export type NavIconName =
  | 'dashboard'
  | 'sales'
  | 'customers'
  | 'credit'
  | 'inventory'
  | 'receiving'
  | 'reports'
  | 'users'
  | 'rider'
  | 'vehicle'
  | 'expense'
  | 'history'

function Base({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

const navIconPaths: Record<NavIconName, ReactNode> = {
  dashboard: (
    <Base>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Base>
  ),
  sales: (
    <Base>
      <path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5L10 21l-2-1.5L6 21V3z" />
      <path d="M9 8h6M9 12h6" />
    </Base>
  ),
  customers: (
    <Base>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 5.9" />
      <path d="M17.5 14.6c2 .9 3.5 2.9 3.5 5.4" />
    </Base>
  ),
  credit: (
    <Base>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </Base>
  ),
  inventory: (
    <Base>
      <path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </Base>
  ),
  receiving: (
    <Base>
      <path d="M4 13l2.5 7h11L20 13" />
      <path d="M4 13h5l1.2 2h3.6L15 13h5" />
      <path d="M12 3v7" />
      <path d="M9.5 7.5L12 10l2.5-2.5" />
    </Base>
  ),
  reports: (
    <Base>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-5M12 16V8M16 16v-3" />
    </Base>
  ),
  users: (
    <Base>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </Base>
  ),
  rider: (
    <Base>
      <circle cx="10" cy="7" r="3" />
      <path d="M3.5 19c0-3.4 2.9-6 6.5-6 1.4 0 2.7.4 3.7 1.2" />
      <rect x="14.5" y="13" width="6" height="6" rx="1" />
    </Base>
  ),
  vehicle: (
    <Base>
      <path d="M2.5 7h12V16H2.5z" />
      <path d="M14.5 10.5h4L21.5 14V16" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </Base>
  ),
  expense: (
    <Base>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </Base>
  ),
  history: (
    <Base>
      <path d="M3.5 12a8.5 8.5 0 1 1 2.5 6" />
      <path d="M3.5 12H7M3.5 12V8.5" />
      <path d="M12 8v4l3 2" />
    </Base>
  ),
}

export function NavIcon({ name }: { name: NavIconName }) {
  return <>{navIconPaths[name]}</>
}
