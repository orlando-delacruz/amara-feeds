import styled from 'styled-components'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
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

const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.size.xxl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
`

const Description = styled.p`
  margin-top: ${({ theme }) => theme.space.xs};
  color: ${({ theme }) => theme.color.text.secondary};
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  flex-shrink: 0;
`

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Wrapper>
      <div>
        <Title>{title}</Title>
        {description && <Description>{description}</Description>}
      </div>
      {actions && <Actions>{actions}</Actions>}
    </Wrapper>
  )
}
