import styled from 'styled-components'
import type { CreditStatus, ProductStatus } from '@/domain'

export type StatusBadgeStatus = ProductStatus | CreditStatus

interface StatusBadgeProps {
  status: StatusBadgeStatus
}

const labels: Record<StatusBadgeStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  outstanding: 'Outstanding',
  settled: 'Settled',
  voided: 'Voided',
}

const tones: Record<StatusBadgeStatus, 'warning' | 'success'> = {
  pending: 'warning',
  active: 'success',
  outstanding: 'warning',
  settled: 'success',
  voided: 'warning',
}

const Badge = styled.span<{ $tone: 'warning' | 'success' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme, $tone }) => theme.color.status[$tone].border};
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme, $tone }) => theme.color.status[$tone].background};
  color: ${({ theme, $tone }) => theme.color.status[$tone].text};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  white-space: nowrap;
`

const Dot = styled.span<{ $tone: 'warning' | 'success' }>`
  width: 6px;
  height: 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme, $tone }) => theme.color.status[$tone].text};
  flex-shrink: 0;
`

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = tones[status]
  return (
    <Badge $tone={tone}>
      <Dot $tone={tone} aria-hidden="true" />
      {labels[status]}
    </Badge>
  )
}
