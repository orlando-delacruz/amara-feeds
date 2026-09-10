export type Money = number

export function sumMinor(values: Money[]): Money {
  return values.reduce((total, value) => total + value, 0)
}

export function formatPeso(amountMinor: Money): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amountMinor / 100)
}
