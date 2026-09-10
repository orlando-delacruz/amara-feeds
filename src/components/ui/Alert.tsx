import styled from 'styled-components'
import type { ReactNode } from 'react'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
}

const variantRole: Record<AlertVariant, 'status' | 'alert'> = {
  info: 'status',
  success: 'status',
  warning: 'alert',
  danger: 'alert',
}

const Wrapper = styled.div<{ $variant: AlertVariant }>`
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid;
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme, $variant }) => theme.color.status[$variant].background};
  border-color: ${({ theme, $variant }) => theme.color.status[$variant].border};
  color: ${({ theme, $variant }) => theme.color.status[$variant].text};
`

const Title = styled.p`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  margin-bottom: ${({ theme }) => theme.space.xs};
`

export function Alert({ variant = 'info', title, children }: AlertProps) {
  return (
    <Wrapper $variant={variant} role={variantRole[variant]}>
      {title && <Title>{title}</Title>}
      <div>{children}</div>
    </Wrapper>
  )
}
