export const tokens = {
  color: {
    white: '#ffffff',
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    brand: {
      50: '#eff6ff',
      100: '#dbeafe',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      muted: '#6b7280',
      inverse: '#ffffff',
    },
    surface: {
      page: '#f9fafb',
      card: '#ffffff',
      overlay: 'rgba(17, 24, 39, 0.5)',
    },
    border: {
      default: '#e5e7eb',
      strong: '#d1d5db',
    },
    focus: {
      ring: '#2563eb',
    },
    status: {
      success: { background: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
      warning: { background: '#fffbeb', border: '#fde68a', text: '#92400e' },
      danger: { background: '#fef2f2', border: '#fecaca', text: '#991b1b' },
      info: { background: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    },
    store: {
      amara: { background: '#ede9fe', border: '#c4b5fd', text: '#5b21b6', solid: '#7c3aed' },
      zeann: { background: '#ffedd5', border: '#fed7aa', text: '#9a3412', solid: '#c2410c' },
    },
  },
  font: {
    family: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    size: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      display: '32px',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      base: 1.5,
    },
  },
  space: {
    0: '0',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px rgba(17, 24, 39, 0.06)',
    md: '0 8px 24px rgba(17, 24, 39, 0.16)',
    lg: '0 16px 40px rgba(17, 24, 39, 0.22)',
  },
  layout: {
    headerHeight: '60px',
    tabBarHeight: '64px',
    contentMaxWidth: '72rem',
  },
  breakpoint: {
    tablet: '640px',
    desktop: '1024px',
  },
  motion: {
    fast: '120ms',
    base: '200ms',
  },
  zIndex: {
    header: 10,
    nav: 20,
    dialog: 30,
    toast: 40,
  },
  touch: {
    minTarget: '44px',
  },
} as const

export type Theme = typeof tokens
