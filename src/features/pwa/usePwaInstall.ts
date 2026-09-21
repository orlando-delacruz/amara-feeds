import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  dismissTutorial,
  detectPlatform,
  hasCapturedInstallPrompt,
  isInstallEntryEligible,
  isStandalone,
  isTutorialDismissed,
  promptInstall,
  shouldShowTutorialAfterLogin,
  startInstallPromptCapture,
  subscribePrompt,
} from './installSupport'

/**
 * Install state for the PWA tutorial (DEC-043). The beforeinstallprompt
 * capture starts at hook mount — App renders this on every screen, so the
 * event is caught as early as React is live.
 */
export function usePwaInstall() {
  const [platform] = useState(() =>
    typeof window === 'undefined'
      ? 'unsupported'
      : detectPlatform(window.navigator.userAgent, window.navigator.maxTouchPoints ?? 0),
  )
  const [standalone, setStandalone] = useState(isStandalone)
  const canPrompt = useSyncExternalStore(subscribePrompt, hasCapturedInstallPrompt, () => false)

  useEffect(() => {
    startInstallPromptCapture()
  }, [])

  useEffect(() => {
    const query = window.matchMedia?.('(display-mode: standalone)')
    const onChange = () => setStandalone(isStandalone())
    query?.addEventListener?.('change', onChange)
    return () => query?.removeEventListener?.('change', onChange)
  }, [])

  // Computed at call time for the login moment — dismissal inside the modal
  // must not re-render dependents mid-flow.
  const autoShowAfterLogin = useCallback(
    () =>
      shouldShowTutorialAfterLogin(
        window.navigator.userAgent,
        window.navigator.maxTouchPoints ?? 0,
        isStandalone(),
        isTutorialDismissed(),
      ),
    [],
  )

  const entryEligible = useCallback(
    () => isInstallEntryEligible(window.navigator.userAgent, window.navigator.maxTouchPoints ?? 0),
    [],
  )

  const dismiss = useCallback(() => dismissTutorial(), [])

  const install = useCallback(async () => {
    const outcome = await promptInstall()
    if (outcome === 'accepted') {
      // Installed now; never auto-show the tutorial again on this device.
      dismissTutorial()
    }
    return outcome
  }, [])

  return { platform, standalone, canPrompt, autoShowAfterLogin, entryEligible, dismiss, install }
}
