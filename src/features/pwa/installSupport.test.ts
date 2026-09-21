import { beforeEach, describe, expect, it } from 'vitest'
import {
  TUTORIAL_DISMISSED_KEY,
  __resetInstallPromptCapture,
  detectPlatform,
  dismissTutorial,
  hasCapturedInstallPrompt,
  isInstallEntryEligible,
  isTutorialDismissed,
  isStandalone,
  promptInstall,
  shouldShowTutorialAfterLogin,
  startInstallPromptCapture,
} from './installSupport'

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const IPADOS_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

describe('detectPlatform', () => {
  it('classifies Android, iPhone and desktop user agents', () => {
    expect(detectPlatform(ANDROID_UA)).toBe('android')
    expect(detectPlatform(IPHONE_UA)).toBe('ios')
    expect(detectPlatform(DESKTOP_UA)).toBe('unsupported')
  })

  it('treats a touch-capable Macintosh as iPadOS', () => {
    expect(detectPlatform(IPADOS_UA, 0)).toBe('unsupported')
    expect(detectPlatform(IPADOS_UA, 5)).toBe('ios')
  })
})

describe('tutorial eligibility', () => {
  it('shows after login on a mobile browser tab that has not dismissed it', () => {
    expect(shouldShowTutorialAfterLogin(ANDROID_UA, 0, false, false)).toBe(true)
    expect(shouldShowTutorialAfterLogin(IPHONE_UA, 0, false, false)).toBe(true)
  })

  it('never shows on desktop, in standalone mode, or after dismissal', () => {
    expect(shouldShowTutorialAfterLogin(DESKTOP_UA, 0, false, false)).toBe(false)
    expect(shouldShowTutorialAfterLogin(ANDROID_UA, 0, true, false)).toBe(false)
    expect(shouldShowTutorialAfterLogin(ANDROID_UA, 0, false, true)).toBe(false)
  })

  it('keeps the More-page entry available on mobile despite dismissal', () => {
    expect(isInstallEntryEligible(ANDROID_UA, 0, false)).toBe(true)
    expect(isInstallEntryEligible(ANDROID_UA, 0, true)).toBe(false)
    expect(isInstallEntryEligible(DESKTOP_UA, 0, false)).toBe(false)
  })
})

describe('dismissal flag', () => {
  it('persists and reads the dismissal marker', () => {
    const storage = memoryStorage()
    expect(isTutorialDismissed(storage)).toBe(false)
    dismissTutorial(storage)
    expect(isTutorialDismissed(storage)).toBe(true)
    expect(storage.getItem(TUTORIAL_DISMISSED_KEY)).toBe('1')
  })
})

describe('beforeinstallprompt capture', () => {
  beforeEach(() => {
    __resetInstallPromptCapture()
  })

  it('captures the deferred prompt and reports the user choice', async () => {
    startInstallPromptCapture()
    expect(hasCapturedInstallPrompt()).toBe(false)

    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>
      userChoice: Promise<{ outcome: 'accepted' }>
    }
    event.prompt = prompt
    event.userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(event)

    expect(hasCapturedInstallPrompt()).toBe(true)
    await expect(promptInstall()).resolves.toBe('accepted')
    expect(prompt).toHaveBeenCalledOnce()
    // The deferred prompt is single-use.
    expect(hasCapturedInstallPrompt()).toBe(false)
  })

  it('reports unavailable when the browser never offered the prompt', async () => {
    startInstallPromptCapture()
    await expect(promptInstall()).resolves.toBe('unavailable')
  })

  it('isStandalone reads false in a plain browser tab', () => {
    expect(isStandalone()).toBe(false)
  })
})
