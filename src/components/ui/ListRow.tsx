import styled from 'styled-components'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Icon } from './icons'

interface ListRowProps {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  href?: string
}

const Row = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  width: 100%;
  min-height: 56px;
  text-align: left;
`

const InteractiveRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  width: 100%;
  min-height: 56px;
  text-align: left;
  color: inherit;
  text-decoration: none;
  border-radius: ${({ theme }) => theme.radius.md};
`

const Leading = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.color.surface.subtle};
  color: ${({ theme }) => theme.color.text.secondary};
  font-weight: ${({ theme }) => theme.font.weight.bold};
`

const Texts = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`

const Title = styled.span`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  overflow-wrap: break-word;
`

const Subtitle = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  overflow-wrap: break-word;
`

const Trailing = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-variant-numeric: tabular-nums;
`

const Chevron = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.color.text.muted};
`

export function ListRow({ leading, title, subtitle, trailing, href }: ListRowProps) {
  const body = (
    <Row>
      {leading !== undefined && <Leading aria-hidden="true">{leading}</Leading>}
      <Texts>
        <Title>{title}</Title>
        {subtitle !== undefined && <Subtitle>{subtitle}</Subtitle>}
      </Texts>
      {trailing !== undefined && <Trailing>{trailing}</Trailing>}
      {href !== undefined && (
        <Chevron aria-hidden="true">
          <Icon name="chevron-right" />
        </Chevron>
      )}
    </Row>
  )
  if (href === undefined) {
    return body
  }
  return <InteractiveRow to={href}>{body}</InteractiveRow>
}
