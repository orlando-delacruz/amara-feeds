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
  margin-bottom: ${({ theme }) => theme.space.md};
`

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  min-width: 0;
`

const Marker = styled.span`
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.sm};
  background-color: ${({ theme }) => theme.color.brand[600]};
`

const Title = styled.h2`
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  text-wrap: balance;
  color: ${({ theme }) => theme.color.text.primary};
`

export function Section({ title, action, children, variant = 'card' }: SectionProps) {
  return (
    <Container $variant={variant}>
      <Header>
        <TitleRow>
          <Marker aria-hidden="true" />
          <Title>{title}</Title>
        </TitleRow>
        {action}
      </Header>
      {children}
    </Container>
  )
}