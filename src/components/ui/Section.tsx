import styled from 'styled-components'
import type { ReactNode } from 'react'

interface SectionProps {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
}

const Container = styled.section`
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  padding: ${({ theme }) => theme.space.lg};
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.md};
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  text-wrap: balance;
`

export function Section({ title, action, children }: SectionProps) {
  return (
    <Container>
      <Header>
        <Title>{title}</Title>
        {action}
      </Header>
      {children}
    </Container>
  )
}
