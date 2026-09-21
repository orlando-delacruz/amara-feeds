import { useEffect, useState } from 'react'
import styled from 'styled-components'

// Offline notice for the installed app shell (DEC-043): the shell loads from
// the service-worker precache, but business data requires Supabase — make the
// missing network explicit instead of showing endless loading states.

const Bar = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(${({ theme }) => theme.layout.tabBarHeight} + env(safe-area-inset-bottom, 0px));
  z-index: ${({ theme }) => theme.zIndex.header};
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.md};
  background-color: ${({ theme }) => theme.color.status.warning.background};
  border-top: 1px solid ${({ theme }) => theme.color.status.warning.border};
  color: ${({ theme }) => theme.color.status.warning.text};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  text-align: center;

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    bottom: 0;
  }
`

export function OfflineBanner() {
  const [offline, setOffline] = useState(() =>
    typeof navigator === 'undefined' ? false : !navigator.onLine,
  )

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) {
    return null
  }
  return (
    <Bar role="status">You are offline. Business data updates when the connection returns.</Bar>
  )
}
