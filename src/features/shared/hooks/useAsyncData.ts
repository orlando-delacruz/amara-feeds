import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../getErrorMessage'

export interface AsyncDataState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

interface LoadState<T> {
  requestKey: string
  data: T | null
  error: string | null
}

export function useAsyncData<T>(loader: () => Promise<T>, key = ''): AsyncDataState<T> {
  const [nonce, setNonce] = useState(0)
  const requestKey = `${key}#${nonce}`
  const [state, setState] = useState<LoadState<T>>({
    requestKey: '',
    data: null,
    error: null,
  })
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let active = true
    loaderRef.current().then(
      (result) => {
        if (active) {
          setState({ requestKey, data: result, error: null })
        }
      },
      (cause: unknown) => {
        if (active) {
          setState({ requestKey, data: null, error: getErrorMessage(cause) })
        }
      },
    )
    return () => {
      active = false
    }
  }, [requestKey])

  const loading = state.requestKey !== requestKey
  const reload = useCallback(() => setNonce((value) => value + 1), [])

  return {
    data: loading ? null : state.data,
    loading,
    error: loading ? null : state.error,
    reload,
  }
}
