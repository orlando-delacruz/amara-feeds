import styled from 'styled-components'
import type { ReactNode } from 'react'

interface SectionProps {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
  variant?: 'card' | 'flush'
}

const Container = styled.section<{ $variant: 'card' | 'flush' }>`
  ${({ theme, $variant }) =>
    $variant === 'card'
      ? `
  background-color: ${theme.color.surface.card};
  border: 1px solid ${theme.color.border.default};
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadow.sm};
  padding: ${theme.space.lg};
  `
      : `
  display: flex;
  flex-direction: column;
  gap: ${theme.space.sm};
  `}
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.sm};
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.tight};
  text-wrap: balance;
`

export function Section({ title, action, children, variant = 'card' }: SectionProps) {
  return (
    <Container $variant={variant}>
      <Header>
        <Title>{title}</Title>
        {action}
      </Header>
      {children}
    </Container>
  )
}
