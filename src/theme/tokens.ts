export const tokens = {
  color: {
    white: '#ffffff',
    cream: '#f7f2e6',
    neutral: {
      50: '#f6f3ec',
      100: '#efe9de',
      200: '#e0d8c7',
      300: '#c8bea9',
      400: '#7d7463',
      500: '#5c5647',
      600: '#4c473b',
      700: '#3a362d',
      800: '#2a271f',
      900: '#201d17',
    },
    brand: {
      50: '#eef2ec',
      100: '#dbe3da',
      600: '#1d3a2f',
      700: '#152b22',
      tint: '#c7d8c9',
    },
    text: {
      primary: '#26221a',
      secondary: '#57503f',
      muted: '#6f6755',
      inverse: '#f7f2e6',
    },
    surface: {
      page: '#f4f0e6',
      subtle: '#ece6d9',
      card: '#fbf8f0',
      overlay: 'rgba(32, 29, 23, 0.5)',
    },
    border: {
      default: '#ddd5c4',
      strong: '#c6bca6',
    },
    focus: {
      ring: '#1d3a2f',
      glow: 'rgba(29, 58, 47, 0.18)',
      dangerGlow: 'rgba(150, 41, 10, 0.16)',
    },
    status: {
      success: { background: '#e6efe3', border: '#c2d7bc', text: '#1c5c33' },
      warning: { background: '#fcf0dc', border: '#ecd29f', text: '#8a4d06' },
      danger: { background: '#fbe7e0', border: '#efc3b4', text: '#96290a' },
      info: { background: '#e8f0ec', border: '#c8dcd1', text: '#174a38' },
    },
    store: {
      amara: {
        background: '#efe9fb',
        border: '#cdc0ee',
        text: '#3b2470',
        solid: '#4a2b9e',
        tint: '#dcd2f5',
      },
      zeann: {
        background: '#fdefe2',
        border: '#f3cfae',
        text: '#6b2606',
        solid: '#93340e',
        tint: '#f8ddc8',
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
    sm: '0 1px 2px rgba(38, 34, 26, 0.06), 0 2px 6px rgba(38, 34, 26, 0.05)',
    md: '0 6px 14px rgba(38, 34, 26, 0.12), 0 2px 5px rgba(38, 34, 26, 0.06)',
    lg: '0 14px 30px rgba(38, 34, 26, 0.18), 0 4px 10px rgba(38, 34, 26, 0.08)',
    raised: '0 10px 22px rgba(38, 34, 26, 0.16), 0 3px 8px rgba(38, 34, 26, 0.08)',
    paint: '0 6px 16px rgba(21, 43, 34, 0.26), 0 2px 5px rgba(21, 43, 34, 0.2)',
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
