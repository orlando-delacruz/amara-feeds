/** Default chrome for areas without store branding (sign-in, admin). */
export const defaultBrowserChrome = {
  favicon: '/favicon.svg',
  themeColor: '#f4f7fa',
} as const

export const adminBrowserChrome = {
  favicon: '/favicon.svg',
  themeColor: '#013c68',
} as const

export function syncBrowserChrome(favicon: string, themeColor: string) {
  const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (iconLink) {
    iconLink.href = favicon
  }
  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeMeta) {
    themeMeta.content = themeColor
  }
}
