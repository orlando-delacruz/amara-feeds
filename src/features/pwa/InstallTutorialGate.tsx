import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/features/session/useSession'
import { InstallTutorialModal } from './InstallTutorialModal'
import { usePwaInstall } from './usePwaInstall'

/**
 * Post-login install tutorial (DEC-043). Fires on the null→signed-in
 * transition — a fresh sign-in or a session restore on a device that has not
 * dismissed it yet. "Maybe later" stores the dismissal permanently; the More
 * page entry re-opens the tutorial on demand.
 */
export function InstallTutorialGate() {
  const { user } = useSession()
  const { autoShowAfterLogin, dismiss } = usePwaInstall()
  const [open, setOpen] = useState(false)
  const prevUserRef = useRef(user)

  useEffect(() => {
    const wasSignedOut = prevUserRef.current === null
    prevUserRef.current = user
    if (!user || !wasSignedOut || !autoShowAfterLogin()) {
      return
    }
    // Let the welcome popup land first; the tutorial appears behind it and is
    // revealed once the welcome modal is dismissed.
    const timer = window.setTimeout(() => setOpen(true), 600)
    return () => window.clearTimeout(timer)
  }, [user, autoShowAfterLogin])

  function handleClose() {
    // Any close without installing means "do not auto-show again on this
    // device"; the More-page entry still opens the tutorial on demand.
    dismiss()
    setOpen(false)
  }

  return <InstallTutorialModal open={open} onClose={handleClose} />
}
