import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'

export interface AsyncEmpty {
  title: string
  description?: string
  action?: ReactNode
}

interface AsyncBoundaryProps {
  loading: boolean
  loadingText?: string
  error: string | null
  onRetry: () => void
  empty: AsyncEmpty | null
  skeleton?: ReactNode
  children: ReactNode
}

export function AsyncBoundary({
  loading,
  loadingText = 'Loading…',
  error,
  onRetry,
  empty,
  skeleton,
  children,
}: AsyncBoundaryProps) {
  if (loading) {
    return <>{skeleton ?? <LoadingState text={loadingText} />}</>
  }
  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />
  }
  if (empty) {
    return <EmptyState title={empty.title} description={empty.description} action={empty.action} />
  }
  return <>{children}</>
}
