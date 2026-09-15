export const tokens = {
  color: {
    white: '#ffffff',
    cream: '#f7f9fb',
    neutral: {
      50: '#f7f9fb',
      100: '#eef2f5',
      200: '#dae0e6',
      300: '#cdcdcd',
      400: '#929eb6',
      500: '#515b74',
      600: '#3a4256',
      700: '#2a3040',
      800: '#1a1f2b',
      900: '#0f131b',
    },
    brand: {
      50: '#eaf7fd',
      100: '#d6effa',
      600: '#013c68',
      700: '#002b4c',
      tint: '#bee7f7',
    },
    text: {
      primary: '#013c68',
      secondary: '#515b74',
      muted: '#6b7590',
      inverse: '#ffffff',
    },
    surface: {
      page: '#f4f7fa',
      subtle: '#eef2f5',
      card: '#ffffff',
      overlay: 'rgba(1, 20, 40, 0.5)',
    },
    border: {
      default: '#cdcdcd',
      strong: '#929eb6',
    },
    focus: {
      ring: '#0184b2',
      glow: 'rgba(1, 132, 178, 0.18)',
      dangerGlow: 'rgba(150, 41, 10, 0.16)',
    },
    status: {
      success: { background: '#e6efe3', border: '#c2d7bc', text: '#1c5c33' },
      warning: { background: '#fcf0dc', border: '#ecd29f', text: '#8a4d06' },
      danger: { background: '#fbe7e0', border: '#efc3b4', text: '#96290a' },
      info: { background: '#e6f2fa', border: '#b9dcf0', text: '#013c68' },
    },
    store: {
      amara: {
        background: '#e6f3fa',
        border: '#b9dcf0',
        text: '#013c68',
        solid: '#016a91',
        tint: '#cfe9f7',
      },
      zeann: {
        background: '#eceff4',
        border: '#c3cad8',
        text: '#3a4256',
        solid: '#515b74',
        tint: '#dbe0ea',
      },
    },
  },
  font: {
    family:
      '"Barlow", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    familyCondensed:
      '"Barlow Condensed", "Barlow", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    size: {
      xs: '11px',
      sm: '13px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      display: '30px',
      hero: '44px',
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
      tight: 1.06,
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
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '10px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px rgba(13, 32, 52, 0.06), 0 2px 6px rgba(13, 32, 52, 0.05)',
    md: '0 6px 14px rgba(13, 32, 52, 0.12), 0 2px 5px rgba(13, 32, 52, 0.06)',
    lg: '0 14px 30px rgba(13, 32, 52, 0.18), 0 4px 10px rgba(13, 32, 52, 0.08)',
    raised: '0 10px 22px rgba(13, 32, 52, 0.16), 0 3px 8px rgba(13, 32, 52, 0.08)',
    paint: '0 6px 16px rgba(1, 43, 76, 0.26), 0 2px 5px rgba(1, 43, 76, 0.2)',
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
