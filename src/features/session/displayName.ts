/** Display name for UI surfaces. Seed names may carry a parenthetical role hint
 * (e.g. "Alice (Amara staff)"); the suffix stays in data, never on screen. */
export function getDisplayName(name: string): string {
  const base = name.split(' (')[0]?.trim() ?? ''
  return base === '' ? name : base
}
