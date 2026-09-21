// PWA install support (DEC-043). Pure detection + the captured
// beforeinstallprompt event, kept free of React so tests can drive every
// input directly (user agent, matchMedia, storage, custom events).

export type InstallPlatform = 'android' | 'ios' | 'unsupported'

export const TUTORIAL_DISMISSED_KEY = 'zaf.pwa.tutorial-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface StandaloneNavigator extends Navigator {
  standalone?: boolean
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let captureStarted = false
const promptListeners = new Set<() => void>()

function notifyPromptListeners(): void {
  for (const listener of promptListeners) {
    listener()
  }
}

export function detectPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  const ua = userAgent.toLowerCase()
  const iPadOs = ua.includes('macintosh') && maxTouchPoints > 1
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod') || iPadOs) {
    return 'ios'
  }
  if (ua.includes('android')) {
    return 'android'
  }
  return 'unsupported'
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  const standaloneQuery = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  return standaloneQuery || (window.navigator as StandaloneNavigator).standalone === true
}

/** Attach once (app entry) so the install prompt is never missed. */
export function startInstallPromptCapture(): void {
  if (captureStarted || typeof window === 'undefined') {
    return
  }
  captureStarted = true
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notifyPromptListeners()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notifyPromptListeners()
  })
}

/** Test-only: reset captured state between tests. */
export function __resetInstallPromptCapture(): void {
  captureStarted = false
  deferredPrompt = null
  promptListeners.clear()
}

export function hasCapturedInstallPrompt(): boolean {
  return deferredPrompt !== null
}

function subscribePrompt(listener: () => void): () => void {
  promptListeners.add(listener)
  return () => promptListeners.delete(listener)
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    return 'unavailable'
  }
  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  notifyPromptListeners()
  return outcome
}

export function isTutorialDismissed(
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): boolean {
  return storage.getItem(TUTORIAL_DISMISSED_KEY) === '1'
}

export function dismissTutorial(storage: Pick<Storage, 'setItem'> = window.localStorage): void {
  storage.setItem(TUTORIAL_DISMISSED_KEY, '1')
}

/** Auto-show eligibility after login: mobile device, browser tab, not dismissed. */
export function shouldShowTutorialAfterLogin(
  userAgent: string,
  maxTouchPoints = 0,
  standalone = isStandalone(),
  dismissed = isTutorialDismissed(),
): boolean {
  return detectPlatform(userAgent, maxTouchPoints) !== 'unsupported' && !standalone && !dismissed
}

/** More-page entry eligibility: mobile device in a browser tab, even if dismissed. */
export function isInstallEntryEligible(
  userAgent: string,
  maxTouchPoints = 0,
  standalone = isStandalone(),
): boolean {
  return detectPlatform(userAgent, maxTouchPoints) !== 'unsupported' && !standalone
}

export { subscribePrompt }
