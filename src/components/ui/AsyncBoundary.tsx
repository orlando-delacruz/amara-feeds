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
  loadingText: string
  error: string | null
  onRetry: () => void
  empty: AsyncEmpty | null
  children: ReactNode
}

export function AsyncBoundary({
  loading,
  loadingText,
  error,
  onRetry,
  empty,
  children,
}: AsyncBoundaryProps) {
  if (loading) {
    return <LoadingState text={loadingText} />
  }
  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />
  }
  if (empty) {
    return <EmptyState title={empty.title} description={empty.description} action={empty.action} />
  }
  return <>{children}</>
}
