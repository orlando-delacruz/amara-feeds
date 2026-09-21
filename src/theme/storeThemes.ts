import type { StoreId } from '@/domain/store'
import { adminBrowserChrome } from './browserChrome'
import { tokens, type Theme } from './tokens'

/**
 * Zeann keeps the established marine-navy brand (DEC-029).
 * Object identity is shared with `tokens` so existing single-theme
 * imports keep working during the per-store migration.
 */
export const zeannTheme: Theme = tokens

/**
 * Amara brand derived from the client's Amara palette.
 * Primary bronze `#AA885A` is the brand fill; white text on it is only
 * 3.3:1, so interactive/text-on-brand roles use the darker `#7E6240`
 * (5.7:1 with white) and body text uses `#4A3F2E` (10.3:1 on white).
 * Status paints and surfaces stay shared so semantic colors keep
 * their meaning on both themes.
 */
export const amaraTheme: Theme = {
  ...tokens,
  color: {
    ...tokens.color,
    brand: {
      50: '#faf3e8',
      100: '#f3e4cc',
      600: '#aa885a',
      700: '#7e6240',
      tint: '#cfb18b',
    },
    text: {
      ...tokens.color.text,
      primary: '#4a3f2e',
    },
    focus: {
      ...tokens.color.focus,
      ring: '#aa885a',
      glow: 'rgba(170, 136, 90, 0.22)',
    },
    status: {
      ...tokens.color.status,
      info: { background: '#faf3e8', border: '#e3cfa8', text: '#4a3f2e' },
    },
    store: {
      ...tokens.color.store,
      amara: {
        background: '#faf3e8',
        border: '#e3cfa8',
        text: '#4a3f2e',
        solid: '#7e6240',
        tint: '#f3e4cc',
      },
    },
  },
}

export const storeThemes: Record<StoreId, Theme> = {
  amara: amaraTheme,
  zeann: zeannTheme,
}

/**
 * Fixed admin theme (DEC-031): navy shell with bronze accents. Primary
 * actions, headers, and nav markers stay Zeann navy; bronze appears in the
 * focus ring, brand-plate detailing (`brand.tint`), and the Amara store
 * identity elements — so the Amara/Zeann filter changes data, never paint.
 * White text on navy `brand.600/700` and focus visibility stay AA-safe.
 */
export const adminTheme: Theme = {
  ...tokens,
  color: {
    ...tokens.color,
    brand: {
      ...tokens.color.brand,
      tint: '#cfb18b',
    },
    focus: {
      ...tokens.color.focus,
      ring: '#aa885a',
      glow: 'rgba(170, 136, 90, 0.22)',
    },
  },
}

/**
 * Fixed sign-in theme (DEC-031): neutral slate, independent of the store
 * context. The signed-out page must not wear whichever store was last
 * selected, so buttons, inputs, and focus all use slate (`brand.600`
 * `#515b74` is 6.8:1 with white; `brand.700` `#3a4256` darker still).
 */
export const signInTheme: Theme = {
  ...tokens,
  color: {
    ...tokens.color,
    brand: {
      50: '#eceff4',
      100: '#dbe0ea',
      600: '#515b74',
      700: '#3a4256',
      tint: '#c3cad8',
    },
    text: {
      ...tokens.color.text,
      primary: '#2a3040',
    },
    focus: {
      ...tokens.color.focus,
      ring: '#515b74',
      glow: 'rgba(81, 91, 116, 0.2)',
    },
  },
}

/** Fixed-navy combined theme + chrome for the admin "all stores" view (DEC-031/DEC-044). */
export const adminAllStoresFallback = {
  theme: adminTheme,
  chrome: adminBrowserChrome,
}
