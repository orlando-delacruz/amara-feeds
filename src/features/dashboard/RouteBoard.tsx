import styled from 'styled-components'
import type { ReactNode } from 'react'

interface RouteBoardProps {
  /** Page name rendered as the heading. */
  title: string
  /** The store route / destination painted under the heading. */
  route: string
  date: string
  /** Optional painted livery stripe rendered along the bottom edge. */
  accent?: ReactNode
}

const Board = styled.header`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg}
    calc(${({ theme }) => theme.space.md} + 3px);
  background-color: ${({ theme }) => theme.color.brand[600]};
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 0 1px rgba(0, 0, 0, 0.12),
    ${({ theme }) => theme.shadow.paint};
  overflow: hidden;
`

const Texts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

const Title = styled.h1`
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.inverse};
`

const Route = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.inverse};
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &::before {
    content: '';
    width: 14px;
    height: 2px;
    flex-shrink: 0;
    background-color: currentColor;
    opacity: 0.7;
  }
`

const Now = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  /* Shrink inward on narrow screens instead of pushing the board wider. */
  min-width: 0;
`

const NowDot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.color.text.inverse};
  animation: nowPulse 2s ease-in-out infinite;

  @keyframes nowPulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.35;
    }
  }
`

const NowText = styled.span`
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.inverse};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Stripe = styled.span`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  height: 3px;
`

export function RouteBoard({ title, route, date, accent }: RouteBoardProps) {
  const now = new Date(`${date}T00:00:00`).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Board>
      <Texts>
        <Title>{title}</Title>
        <Route>{route}</Route>
      </Texts>
      <Now>
        <NowDot aria-hidden="true" />
        <NowText>Today · {now}</NowText>
      </Now>
      {accent && <Stripe aria-hidden="true">{accent}</Stripe>}
    </Board>
  )
}
