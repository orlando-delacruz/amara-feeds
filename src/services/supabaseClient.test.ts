import { describe, expect, it } from 'vitest'
import { usernameEmail } from './supabaseClient'

describe('usernameEmail login handle resolution', () => {
  it('keeps the username@zafone.local convention for bare usernames', () => {
    expect(usernameEmail('alice')).toBe('alice@zafone.local')
    expect(usernameEmail('  Ben  ')).toBe('ben@zafone.local')
  })

  it('uses an email-shaped login handle as-is', () => {
    expect(usernameEmail('jhoann@admin.com')).toBe('jhoann@admin.com')
    expect(usernameEmail('  Jhoann@Admin.com ')).toBe('jhoann@admin.com')
  })
})
