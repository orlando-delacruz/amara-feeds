import styled from 'styled-components'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  action?: ReactNode
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.lg};
  text-align: center;
  background-color: ${({ theme }) => theme.color.status.danger.background};
  border: 1px solid ${({ theme }) => theme.color.status.danger.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.color.status.danger.text};
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  max-width: 32rem;
`

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again. If the problem continues, return to the previous screen.',
  onRetry,
  retryLabel = 'Try again',
  action,
}: ErrorStateProps) {
  return (
    <Wrapper role="alert">
      <Title>{title}</Title>
      <Description>{description}</Description>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
      {action}
    </Wrapper>
  )
}
