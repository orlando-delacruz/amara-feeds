import styled from 'styled-components'
import type { CreditStatus, ProductStatus } from '@/domain'

export type StatusBadgeStatus = ProductStatus | CreditStatus

interface StatusBadgeProps {
  status: StatusBadgeStatus
}

const labels: Record<StatusBadgeStatus, string> = {
  pending: 'Pending approval',
  active: 'Active',
  outstanding: 'Outstanding',
  settled: 'Settled',
}

const tones: Record<StatusBadgeStatus, 'warning' | 'success'> = {
  pending: 'warning',
  active: 'success',
  outstanding: 'warning',
  settled: 'success',
}

const Badge = styled.span<{ $tone: 'warning' | 'success' }>`
  display: inline-block;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme, $tone }) => theme.color.status[$tone].border};
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme, $tone }) => theme.color.status[$tone].background};
  color: ${({ theme, $tone }) => theme.color.status[$tone].text};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  white-space: nowrap;
`

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge $tone={tones[status]}>{labels[status]}</Badge>
}
