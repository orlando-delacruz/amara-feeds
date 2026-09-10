import { useCallback, useRef, useState } from 'react'
import { getErrorMessage } from '../getErrorMessage'

export interface MutationState<TInput, TResult> {
  run: (input: TInput) => Promise<TResult | undefined>
  pending: boolean
  error: string | null
  reset: () => void
}

export function useMutation<TInput, TResult>(
  mutate: (input: TInput) => Promise<TResult>,
): MutationState<TInput, TResult> {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef(false)

  const run = useCallback(
    async (input: TInput) => {
      if (pendingRef.current) {
        return undefined
      }
      pendingRef.current = true
      setPending(true)
      setError(null)
      try {
        return await mutate(input)
      } catch (cause) {
        setError(getErrorMessage(cause))
        return undefined
      } finally {
        pendingRef.current = false
        setPending(false)
      }
    },
    [mutate],
  )

  const reset = useCallback(() => setError(null), [])
  return { run, pending, error, reset }
}
