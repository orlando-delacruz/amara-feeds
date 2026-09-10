import styled from 'styled-components'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  caption?: ReactNode
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  padding: ${({ theme }) => theme.space.lg};
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`

const Label = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.secondary};
`

const Value = styled.span`
  font-size: ${({ theme }) => theme.font.size.display};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  font-variant-numeric: tabular-nums;
  text-wrap: balance;
`

const Caption = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
`

export function StatCard({ label, value, caption }: StatCardProps) {
  return (
    <Container>
      <Label>{label}</Label>
      <Value>{value}</Value>
      {caption !== undefined && <Caption>{caption}</Caption>}
    </Container>
  )
}
