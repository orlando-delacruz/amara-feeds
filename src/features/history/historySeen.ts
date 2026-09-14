const STORAGE_KEY = 'amara-feeds:history:last-seen'

export function getHistoryLastSeen(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setHistoryLastSeen(date: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, date)
  } catch {
    // Private browsing or storage full — silently skip.
  }
}
