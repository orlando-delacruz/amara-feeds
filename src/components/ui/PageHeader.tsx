import styled from 'styled-components'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  size?: 'default' | 'compact'
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  margin-bottom: ${({ theme }) => theme.space.lg};

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`

const Title = styled.h1<{ $compact: boolean }>`
  font-size: ${({ theme, $compact }) => ($compact ? theme.font.size.xl : theme.font.size.xxl)};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.tight};
  text-wrap: balance;
  color: ${({ theme }) => theme.color.text.primary};
`

const Description = styled.p`
  margin-top: ${({ theme }) => theme.space.xs};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  flex-shrink: 0;
`

export function PageHeader({ title, description, actions, size = 'default' }: PageHeaderProps) {
  return (
    <Wrapper>
      <div style={{ minWidth: 0 }}>
        <Title $compact={size === 'compact'}>{title}</Title>
        {description && <Description>{description}</Description>}
      </div>
      {actions && <Actions>{actions}</Actions>}
    </Wrapper>
  )
}
