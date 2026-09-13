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
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.xxxl} ${({ theme }) => theme.space.lg};
  text-align: center;
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`

const IconCircle = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.color.surface.subtle};
  color: ${({ theme }) => theme.color.text.muted};
  font-size: 24px;
  margin-bottom: ${({ theme }) => theme.space.xs};
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
  max-width: 32rem;
`

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Wrapper>
      <IconCircle aria-hidden="true">📋</IconCircle>
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {action}
    </Wrapper>
  )
}
