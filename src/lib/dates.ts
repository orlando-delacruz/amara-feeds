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

export function subDaysDateOnly(dateOnly: string, days: number): string {
  const date = new Date(`${dateOnly}T00:00:00`)
  date.setDate(date.getDate() - days)
  return toDateOnly(date)
}

/** First day (YYYY-MM-DD) of the calendar month containing `dateOnly`. */
export function startOfMonthOnly(dateOnly: string): string {
  return `${dateOnly.slice(0, 7)}-01`
}

/** Start of the trailing 7-day window ending on `dateOnly` (inclusive). */
export function startOfWeekWindowOnly(dateOnly: string): string {
  return subDaysDateOnly(dateOnly, 6)
}

export function isDateOnlyInRange(
  isoTimestamp: string,
  startDateOnly: string,
  endDateOnly: string,
): boolean {
  const day = toDateOnly(new Date(isoTimestamp))
  return day >= startDateOnly && day <= endDateOnly
}

export function addDays(isoTimestamp: string, days: number): string {
  const date = new Date(isoTimestamp)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}
