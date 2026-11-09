import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Scroll restoration for route changes.
 *
 * Navigating to another page (push/replace) starts at the top of the page
 * content; going back (or forward) returns to the exact position left on
 * that location. Positions are tracked per pathname+search from live scroll
 * events, and the browser's native restoration is disabled so the two never
 * fight over the same back/forward jump.
 */
export function ScrollManager() {
  const { pathname, search, hash } = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())
  const key = `${pathname}${search}`

  // Claim manual restoration once: the browser default would otherwise apply
  // its own snapshot on top of ours on back/forward.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // Keep the current location's position fresh while it is visible; the
  // cleanup saves one last snapshot when leaving it.
  useEffect(() => {
    const save = () => {
      positions.current.set(key, window.scrollY)
    }
    window.addEventListener('scroll', save, { passive: true })
    return () => {
      save()
      window.removeEventListener('scroll', save)
    }
  }, [key])

  // Apply on arrival, before paint so a pushed page never flashes mid-scroll.
  // Skipped for hash links so the native anchor jump (plus the global
  // scroll-padding-top offset for the sticky header) stands.
  useLayoutEffect(() => {
    if (hash) {
      return
    }
    if (navigationType === 'POP' && positions.current.has(key)) {
      window.scrollTo(0, positions.current.get(key) ?? 0)
    } else {
      window.scrollTo(0, 0)
    }
  }, [key, navigationType, hash])

  return null
}
