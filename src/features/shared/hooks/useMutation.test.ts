import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMutation } from './useMutation'

describe('useMutation', () => {
  it('ignores a second submission while the first is pending', async () => {
    let release: () => void = () => {}
    const mutate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )
    const { result } = renderHook(() => useMutation<undefined, void>(mutate))

    let first: Promise<void | undefined> = Promise.resolve(undefined)
    act(() => {
      first = result.current.run(undefined)
    })
    expect(result.current.pending).toBe(true)

    await act(async () => {
      await result.current.run(undefined)
    })
    expect(mutate).toHaveBeenCalledTimes(1)

    await act(async () => {
      release()
      await first
    })
    expect(result.current.pending).toBe(false)
  })

  it('captures a failure message and exposes it', async () => {
    const mutate = vi.fn(() => Promise.reject(new Error('Nope')))
    const { result } = renderHook(() => useMutation<undefined, void>(mutate))

    await act(async () => {
      await result.current.run(undefined)
    })

    expect(result.current.error).toBe('Nope')
  })
})
