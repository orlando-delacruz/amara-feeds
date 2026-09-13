import styled from 'styled-components'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  interactive?: boolean
}

const Container = styled.div<{ $interactive: boolean }>`
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  padding: ${({ theme }) => theme.space.lg};
  ${({ $interactive, theme }) =>
    $interactive &&
    `
    cursor: pointer;
    transition: box-shadow ${theme.motion.base} ease-out, transform ${theme.motion.base} ease-out, border-color ${theme.motion.base} ease-out;

    &:hover {
      box-shadow: ${theme.shadow.raised};
      border-color: ${theme.color.border.strong};
    }

    &:active {
      transform: translateY(0.5px);
      box-shadow: ${theme.shadow.sm};
    }
  `}
`

export function Card({ children, interactive = false }: CardProps) {
  return (
    <Container $interactive={interactive} {...(interactive ? { role: 'link' as const } : {})}>
      {children}
    </Container>
  )
}
