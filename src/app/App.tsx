import { BrowserRouter } from 'react-router-dom'
import { OfflineBanner } from '@/features/pwa/OfflineBanner'
import { AppRoutes } from './router'

export function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <AppRoutes />
    </BrowserRouter>
  )
}
