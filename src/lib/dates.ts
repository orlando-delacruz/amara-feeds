export function nowIso(): string {
  return new Date().toISOString()
}

export function toDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayIso(): string {
  return toDateOnly(new Date())
}

export function isSameDate(isoTimestamp: string, dateOnly: string): boolean {
  return toDateOnly(new Date(isoTimestamp)) === dateOnly
}

export function addDays(isoTimestamp: string, days: number): string {
  const date = new Date(isoTimestamp)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}
