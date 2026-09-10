import styled from 'styled-components'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
}

const Container = styled.div`
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  padding: ${({ theme }) => theme.space.lg};
`

export function Card({ children }: CardProps) {
  return <Container>{children}</Container>
}
