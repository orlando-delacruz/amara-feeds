import { formatPeso } from '@/lib/money'
import type { Money } from '@/lib/money'

interface MoneyTextProps {
  amountMinor: Money
}

export function MoneyText({ amountMinor }: MoneyTextProps) {
  return <span>{formatPeso(amountMinor)}</span>
}
