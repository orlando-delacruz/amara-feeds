import { describe, expect, it } from 'vitest'
import { adminTheme, amaraTheme, signInTheme, storeThemes, zeannTheme } from './storeThemes'
import { tokens } from './tokens'

function luminance(hex: string): number {
  const normalized = hex.replace('#', '')
  const channels = [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16) / 255)
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4),
  )
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrast(foreground: string, background: string): number {
  const high = Math.max(luminance(foreground), luminance(background))
  const low = Math.min(luminance(foreground), luminance(background))
  return (high + 0.05) / (low + 0.05)
}

describe('storeThemes', () => {
  it('keeps the Zeann theme identical to the base tokens', () => {
    expect(zeannTheme).toBe(tokens)
    expect(storeThemes.zeann).toBe(tokens)
  })

  it('uses bronze as the Amara primary brand color', () => {
    expect(storeThemes.amara.color.brand[600]).toBe('#aa885a')
  })

  it('keeps shared surfaces and semantic status colors identical across stores', () => {
    expect(amaraTheme.color.surface).toEqual(tokens.color.surface)
    expect(amaraTheme.color.status.success).toEqual(tokens.color.status.success)
    expect(amaraTheme.color.status.warning).toEqual(tokens.color.status.warning)
    expect(amaraTheme.color.status.danger).toEqual(tokens.color.status.danger)
  })

  it('meets WCAG AA for white text on the Amara interactive brand shade', () => {
    expect(contrast(amaraTheme.color.brand[700], '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  it('meets WCAG AA for Amara body text on white', () => {
    expect(contrast(amaraTheme.color.text.primary, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the admin shell navy with bronze accents', () => {
    expect(adminTheme.color.brand[600]).toBe('#013c68')
    expect(adminTheme.color.brand[700]).toBe('#002b4c')
    expect(adminTheme.color.focus.ring).toBe('#aa885a')
    expect(adminTheme.color.brand.tint).toBe('#cfb18b')
    expect(adminTheme.color.store.amara).toEqual(tokens.color.store.amara)
    expect(adminTheme.color.store.zeann).toEqual(tokens.color.store.zeann)
  })

  it('keeps the sign-in theme neutral slate', () => {
    expect(signInTheme.color.brand[600]).toBe('#515b74')
    expect(signInTheme.color.brand[700]).toBe('#3a4256')
  })

  it('keeps shared surfaces and status colors identical on the area themes', () => {
    for (const theme of [adminTheme, signInTheme]) {
      expect(theme.color.surface).toEqual(tokens.color.surface)
      expect(theme.color.status).toEqual(tokens.color.status)
    }
  })

  it('meets WCAG AA for white text on the sign-in brand shades', () => {
    expect(contrast(signInTheme.color.brand[600], '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(contrast(signInTheme.color.brand[700], '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
})
