import amaraLogo from '@/assets/amara-logo-clear.png'
import zeannLogo from '@/assets/zeann-logo-clear.png'
import type { StoreId } from '@/domain/store'

interface StoreBranding {
  /** Bundled full badge used in-app (header, sign-in). */
  logo: string
  /** Accessible name for the in-app logo image. */
  alt: string
  /** Public URL swapped into <link rel="icon"> per store. */
  favicon: string
  /** Browser chrome color per store. */
  themeColor: string
}

export const storeBranding: Record<StoreId, StoreBranding> = {
  amara: {
    logo: amaraLogo,
    alt: 'Amara logo',
    favicon: '/amara-logo-clear.png',
    themeColor: '#aa885a',
  },
  zeann: {
    logo: zeannLogo,
    alt: 'Zeann logo',
    favicon: '/zeann-logo-clear.png',
    themeColor: '#013c68',
  },
}
