import styled from 'styled-components'

export type BalanceState = 'healthy' | 'attention' | 'critical'

const LABELS: Record<BalanceState, string> = {
  healthy: 'Healthy',
  attention: 'Attention',
  critical: 'Critical',
}

const Chip = styled.span<{ $state: BalanceState }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
  padding: 2px ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.inverse};
  background-color: ${({ theme, $state }) =>
    $state === 'healthy'
      ? theme.color.status.success.text
      : $state === 'attention'
        ? theme.color.status.warning.text
        : theme.color.status.danger.text};
`

const Rivet = styled.span`
  width: 5px;
  height: 5px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: currentColor;
  opacity: 0.85;
`

export function BalanceStateChip({ state }: { state: BalanceState }) {
  return (
    <Chip $state={state}>
      <Rivet aria-hidden="true" />
      {LABELS[state]}
    </Chip>
  )
}
