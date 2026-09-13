export const tokens = {
  color: {
    white: '#ffffff',
    neutral: {
      50: '#faf9f6',
      100: '#f4f2ec',
      200: '#e9e5db',
      300: '#d8d2c4',
      400: '#a8a293',
      500: '#7a756a',
      600: '#5b574e',
      700: '#4a463f',
      800: '#322f2a',
      900: '#211f1a',
    },
    brand: {
      50: '#ecf7f0',
      100: '#d7edde',
      600: '#157347',
      700: '#0e5c38',
      gradient: 'linear-gradient(135deg, #1f7a4d 0%, #2e9d63 100%)',
    },
    text: {
      primary: '#211f1a',
      secondary: '#5b574e',
      muted: '#7a756a',
      inverse: '#ffffff',
    },
    surface: {
      page: '#faf9f6',
      subtle: '#f4f2ec',
      card: '#ffffff',
      overlay: 'rgba(33, 31, 26, 0.5)',
    },
    border: {
      default: '#e9e5db',
      strong: '#d8d2c4',
    },
    focus: {
      ring: '#157347',
    },
    status: {
      success: { background: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
      warning: { background: '#fffbeb', border: '#fde68a', text: '#92400e' },
      danger: { background: '#fef2f2', border: '#fecaca', text: '#991b1b' },
      info: { background: '#ecf7f0', border: '#d7edde', text: '#0e5c38' },
    },
    store: {
      amara: { background: '#ede9fe', border: '#c4b5fd', text: '#5b21b6', solid: '#7c3aed' },
      zeann: { background: '#ffedd5', border: '#fed7aa', text: '#9a3412', solid: '#c2410c' },
    },
  },
  font: {
    family:
      '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    size: {
      xs: '11px',
      sm: '13px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      display: '28px',
      hero: '32px',
    },
    tracking: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.06em',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.15,
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
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px rgba(33, 31, 26, 0.04), 0 2px 6px rgba(33, 31, 26, 0.03)',
    md: '0 6px 16px rgba(33, 31, 26, 0.08), 0 2px 6px rgba(33, 31, 26, 0.04)',
    lg: '0 12px 32px rgba(33, 31, 26, 0.14), 0 4px 12px rgba(33, 31, 26, 0.06)',
    raised: '0 8px 20px rgba(33, 31, 26, 0.12), 0 2px 8px rgba(33, 31, 26, 0.06)',
  },
  layout: {
    headerHeight: '60px',
    tabBarHeight: '64px',
    contentMaxWidth: '72rem',
  },
  breakpoint: {
    phoneWide: '430px',
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
