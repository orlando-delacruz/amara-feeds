import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { confirmAction, notifyInfo } from '@/lib/swal'
import { App } from './app/App'
import { AppProviders } from './app/providers'

// PWA service worker (DEC-043): prompt-style updates — a new deploy asks the
// user before the installed app reloads into the new version. The updater
// returned by registerSW must be used: it posts SKIP_WAITING to the waiting
// worker and reloads only after the new worker takes control — a plain
// location.reload() never activates it and the prompt would repeat forever.
const updateSW = registerSW({
  onNeedRefresh() {
    void confirmAction({
      title: 'Update available',
      text: 'A new version of ZAF ONE is ready.',
      confirmLabel: 'Refresh',
    }).then((confirmed) => {
      if (confirmed) {
        void updateSW(true)
      } else {
        void notifyInfo('Update postponed', 'The update applies on your next visit.')
      }
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
