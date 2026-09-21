import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { act } from 'react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { SessionContext } from '@/features/session/SessionContext'
import { tokens } from '@/theme/tokens'
import type { User } from '@/domain'
import { InstallTutorialGate } from './InstallTutorialGate'
import { InstallTutorialModal } from './InstallTutorialModal'
import { __resetInstallPromptCapture } from './installSupport'

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const staffUser: User = {
  id: 'user-1',
  name: 'Alice',
  role: 'staff',
  storeId: 'amara',
  username: 'alice',
  active: true,
}

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
}

function renderModal(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={tokens}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>,
  )
}

function renderGate(user: User | null) {
  return renderModal(
    <SessionContext.Provider value={{ user, signIn: vi.fn(), signOut: vi.fn() }}>
      <InstallTutorialGate />
    </SessionContext.Provider>,
  )
}

async function signInAfterRender(user: User) {
  const utils = renderGate(null)
  await act(async () => {
    utils.rerender(
      <ThemeProvider theme={tokens}>
        <MemoryRouter>
          <SessionContext.Provider value={{ user, signIn: vi.fn(), signOut: vi.fn() }}>
            <InstallTutorialGate />
          </SessionContext.Provider>
        </MemoryRouter>
      </ThemeProvider>,
    )
  })
  return utils
}

describe('InstallTutorialGate', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    window.localStorage.clear()
    __resetInstallPromptCapture()
  })

  afterEach(() => {
    vi.useRealTimers()
    setUserAgent(DESKTOP_UA)
  })

  it('opens once after signing in on a mobile browser', async () => {
    setUserAgent(ANDROID_UA)
    const { rerender } = await signInAfterRender(staffUser)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(screen.getByRole('dialog', { name: 'Install ZAF ONE' })).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Maybe later' }))
    expect(window.localStorage.getItem('zaf.pwa.tutorial-dismissed')).toBe('1')

    // A later sign-in on the same device stays silent after dismissal.
    await act(async () => {
      rerender(
        <ThemeProvider theme={tokens}>
          <MemoryRouter>
            <SessionContext.Provider value={{ user: null, signIn: vi.fn(), signOut: vi.fn() }}>
              <InstallTutorialGate />
            </SessionContext.Provider>
          </MemoryRouter>
        </ThemeProvider>,
      )
      rerender(
        <ThemeProvider theme={tokens}>
          <MemoryRouter>
            <SessionContext.Provider value={{ user: staffUser, signIn: vi.fn(), signOut: vi.fn() }}>
              <InstallTutorialGate />
            </SessionContext.Provider>
          </MemoryRouter>
        </ThemeProvider>,
      )
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(screen.queryByRole('dialog', { name: 'Install ZAF ONE' })).not.toBeInTheDocument()
  })

  it('stays silent on desktop and for a restored desktop session', async () => {
    setUserAgent(DESKTOP_UA)
    await signInAfterRender(staffUser)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(screen.queryByRole('dialog', { name: 'Install ZAF ONE' })).not.toBeInTheDocument()
  })

  it('does not open for an already-signed-in render (session restore path with flag unset is trigger-free only when signed in from mount)', async () => {
    setUserAgent(ANDROID_UA)
    renderGate(staffUser)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(screen.queryByRole('dialog', { name: 'Install ZAF ONE' })).not.toBeInTheDocument()
  })
})

describe('InstallTutorialModal', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows Safari share-sheet steps on iOS without a native prompt button', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    )
    renderModal(<InstallTutorialModal open onClose={() => {}} />)
    expect(screen.getByText('On iPhone / iPad (Safari)')).toBeInTheDocument()
    expect(screen.getByText(/Share/)).toBeInTheDocument()
    expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Install now' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Maybe later' })).toBeInTheDocument()
  })

  it('shows the Chrome menu steps on Android and closes via Maybe later', async () => {
    setUserAgent(ANDROID_UA)
    const onClose = vi.fn()
    renderModal(<InstallTutorialModal open onClose={onClose} />)
    expect(screen.getByText('On Android (Chrome)')).toBeInTheDocument()
    expect(screen.getByText(/⋮ menu/)).toBeInTheDocument()
    // No captured beforeinstallprompt: no native "Install now" shortcut.
    expect(screen.queryByRole('button', { name: 'Install now' })).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Maybe later' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('opens closed-state as nothing', () => {
    setUserAgent(ANDROID_UA)
    renderModal(<InstallTutorialModal open={false} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('InstallTutorialModal escape hatch', () => {
  it('closes on Escape via the shared Dialog behavior', async () => {
    setUserAgent(ANDROID_UA)
    const onClose = vi.fn()
    renderModal(<InstallTutorialModal open onClose={onClose} />)
    await waitFor(async () => {
      await userEvent.setup().keyboard('{Escape}')
      expect(onClose).toHaveBeenCalled()
    })
  })
})
