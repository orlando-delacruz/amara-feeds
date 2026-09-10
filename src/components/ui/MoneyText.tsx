import styled from 'styled-components'
import { formatPeso } from '@/lib/money'
import type { Money } from '@/lib/money'

interface MoneyTextProps {
  amountMinor: Money
}

const Value = styled.span`
  font-variant-numeric: tabular-nums;
`

export function MoneyText({ amountMinor }: MoneyTextProps) {
  return <Value>{formatPeso(amountMinor)}</Value>
}
