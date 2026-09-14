import styled from 'styled-components'
import type { ReactNode } from 'react'
import { Icon } from './icons'
import type { IconName } from './icons'

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

const icons: Record<AlertVariant, IconName> = {
  info: 'info',
  success: 'check',
  warning: 'alert',
  danger: 'x',
}

const Wrapper = styled.div<{ $variant: AlertVariant }>`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid;
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme, $variant }) => theme.color.status[$variant].background};
  border-color: ${({ theme, $variant }) => theme.color.status[$variant].border};
  color: ${({ theme, $variant }) => theme.color.status[$variant].text};
`

const AlertIcon = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
`

const Content = styled.span`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  min-width: 0;
`

const Title = styled.p`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

export function Alert({ variant = 'info', title, children }: AlertProps) {
  return (
    <Wrapper $variant={variant} role={variantRole[variant]}>
      <AlertIcon aria-hidden="true">
        <Icon name={icons[variant]} />
      </AlertIcon>
      <Content>
        {title && <Title>{title}</Title>}
        <div>{children}</div>
      </Content>
    </Wrapper>
  )
}
