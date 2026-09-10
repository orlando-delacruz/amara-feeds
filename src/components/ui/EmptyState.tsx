import styled from 'styled-components'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.lg};
  text-align: center;
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  max-width: 32rem;
`

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Wrapper>
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {action}
    </Wrapper>
  )
}
