import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { ScrollManager } from './ScrollManager'

const scrollTo = vi.fn()
let scrollY = 0
let scrollYDescriptor: PropertyDescriptor | undefined

function Harness() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <ScrollManager />
      <div data-testid="path">{location.pathname}</div>
      <button type="button" onClick={() => navigate('/two')}>
        go two
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        go back
      </button>
    </>
  )
}

function renderHarness() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/one']}>
      <Harness />
    </MemoryRouter>,
  )
}

describe('ScrollManager', () => {
  beforeEach(() => {
    scrollY = 0
    scrollTo.mockClear()
    window.scrollTo = scrollTo as typeof window.scrollTo
    scrollYDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollY')
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY })
  })

  afterEach(() => {
    if (scrollYDescriptor) {
      Object.defineProperty(window, 'scrollY', scrollYDescriptor)
    }
  })

  it('starts a pushed page at the top', async () => {
    const user = userEvent.setup()
    renderHarness()
    expect(await screen.findByTestId('path')).toHaveTextContent('/one')
    scrollTo.mockClear()

    // Leave /one partway down, then navigate forward.
    scrollY = 200
    window.dispatchEvent(new Event('scroll'))
    await user.click(screen.getByRole('button', { name: 'go two' }))

    expect(await screen.findByTestId('path')).toHaveTextContent('/two')
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
  })

  it('returns to the saved position on back', async () => {
    const user = userEvent.setup()
    renderHarness()
    expect(await screen.findByTestId('path')).toHaveTextContent('/one')
    scrollTo.mockClear()

    scrollY = 200
    window.dispatchEvent(new Event('scroll'))
    await user.click(screen.getByRole('button', { name: 'go two' }))
    expect(await screen.findByTestId('path')).toHaveTextContent('/two')

    await user.click(screen.getByRole('button', { name: 'go back' }))
    expect(await screen.findByTestId('path')).toHaveTextContent('/one')
    expect(scrollTo).toHaveBeenLastCalledWith(0, 200)
  })
})
