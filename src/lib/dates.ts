const BUSINESS_TIMEZONE = 'Asia/Manila'

export function nowIso(): string {
  return new Date().toISOString()
}

/** Date-only string (YYYY-MM-DD) in the Philippine business timezone. */
export function toDateOnly(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function todayIso(): string {
  return toDateOnly(new Date())
}

export function isSameDate(isoTimestamp: string, dateOnly: string): boolean {
  return toDateOnly(new Date(isoTimestamp)) === dateOnly
}

export function subDaysDateOnly(dateOnly: string, days: number): string {
  const [year, month, day] = dateOnly.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() - days)
  return toDateOnly(date)
}

/** First day (YYYY-MM-DD) of the calendar month containing `dateOnly`. */
export function startOfMonthOnly(dateOnly: string): string {
  return `${dateOnly.slice(0, 7)}-01`
}

/** Sunday (YYYY-MM-DD) of the calendar week (Sunday–Saturday) containing `dateOnly`. */
export function startOfWeekOnly(dateOnly: string): string {
  const [year, month, day] = dateOnly.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const daysSinceSunday = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() - daysSinceSunday)
  return toDateOnly(date)
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
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}