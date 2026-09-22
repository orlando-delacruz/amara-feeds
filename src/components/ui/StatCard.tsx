import styled from 'styled-components'
import type { ReactNode } from 'react'
import type { Theme } from '@/theme/tokens'

export type StatCardTone = 'neutral' | 'brand' | 'amara' | 'zeann'
export type StatCardValueScale = 'hero' | 'large' | 'medium'

interface StatCardProps {
  label: string
  value: ReactNode
  caption?: ReactNode
  tone?: StatCardTone
  icon?: ReactNode
  valueScale?: StatCardValueScale
  orientation?: 'column' | 'row'
  /** Renders the card as a filled enamel plate (painted ground, stencil ink). */
  panel?: boolean
  /** Renders the card as a hollow stencil plate (painted outline on the wall). */
  outline?: boolean
  /** Optional status tag rendered beside the label (column) or caption (row). */
  badge?: ReactNode
}

function paint(theme: Theme, tone: StatCardTone): string {
  if (tone === 'brand') return theme.color.brand[600]
  if (tone === 'amara' || tone === 'zeann') return theme.color.store[tone].solid
  return theme.color.neutral[800]
}

function tint(theme: Theme, tone: StatCardTone): string {
  if (tone === 'brand') return theme.color.brand.tint
  if (tone === 'amara' || tone === 'zeann') return theme.color.store[tone].tint
  return theme.color.neutral[300]
}

function wash(theme: Theme, tone: StatCardTone): string {
  if (tone === 'brand') return theme.color.brand[50]
  if (tone === 'amara' || tone === 'zeann') return theme.color.store[tone].background
  return theme.color.surface.subtle
}

function ink(theme: Theme, tone: StatCardTone): string {
  if (tone === 'brand') return theme.color.brand[700]
  if (tone === 'amara' || tone === 'zeann') return theme.color.store[tone].text
  return theme.color.text.secondary
}

const Container = styled.div<{
  $tone: StatCardTone
  $row: boolean
  $panel: boolean
  $outline: boolean
}>`
  display: flex;
  flex-direction: ${({ $row }) => ($row ? 'row' : 'column')};
  align-items: ${({ $row }) => ($row ? 'center' : 'stretch')};
  gap: ${({ theme, $row }) => ($row ? theme.space.md : theme.space.xs)};
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radius.lg};
  /* Unbreakable money strings must never force the card past the viewport. */
  min-width: 0;

  ${({ theme, $panel, $outline, $tone }) =>
    $panel
      ? `
        background-color: ${paint(theme, $tone)};
        color: ${theme.color.text.inverse};
        border: 1px solid rgba(0, 0, 0, 0.28);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          inset 0 0 0 1px rgba(0, 0, 0, 0.12),
          ${theme.shadow.paint};
      `
      : $outline
        ? `
        background-color: transparent;
        border: 2px solid ${paint(theme, $tone)};
      `
        : `
        background-color: ${theme.color.surface.card};
        border: 1px solid ${theme.color.border.default};
      `}
`

const TopRow = styled.span<{ $plate: boolean; $tone: StatCardTone }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`

const BadgeSlot = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: auto;
`

const Marker = styled.span<{ $tone: StatCardTone }>`
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.sm};
  background-color: ${({ theme, $tone }) => paint(theme, $tone)};
`

const IconChip = styled.span<{ $tone: StatCardTone; $plate: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.md};

  ${({ theme, $plate, $tone }) =>
    $plate
      ? `
        background-color: rgba(255, 255, 255, 0.14);
        color: ${theme.color.text.inverse};
      `
      : `
        background-color: ${wash(theme, $tone)};
        color: ${ink(theme, $tone)};
      `}
`

const Label = styled.span<{ $plate: boolean; $outline: boolean; $tone: StatCardTone }>`
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme, $plate }) => ($plate ? theme.font.size.md : theme.font.size.sm)};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  color: ${({ theme, $plate, $outline, $tone }) =>
    $plate ? tint(theme, $tone) : $outline ? paint(theme, $tone) : theme.color.text.secondary};
`

const Value = styled.span<{ $scale: StatCardValueScale; $plate: boolean; $tone: StatCardTone }>`
  /* Money strings have no break points and can outgrow small viewports at
     full display size — scale with the viewport (clamp) instead of a fixed
     desktop size, and letter-break only as a last resort. */
  font-size: ${({ theme, $scale }) =>
    $scale === 'hero'
      ? 'clamp(28px, 9vw, ' + theme.font.size.hero + ')'
      : $scale === 'large'
        ? 'clamp(22px, 7vw, ' + theme.font.size.display + ')'
        : theme.font.size.xxl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.tight};
  font-variant-numeric: tabular-nums;
  text-wrap: balance;
  overflow-wrap: anywhere;
  min-width: 0;
  color: ${({ theme, $plate, $tone }) => ($plate ? theme.color.text.inverse : paint(theme, $tone))};
`

const Caption = styled.span<{
  $plate: boolean
  $outline: boolean
  $tone: StatCardTone
}>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme, $plate, $outline, $tone }) =>
    $plate ? tint(theme, $tone) : $outline ? paint(theme, $tone) : theme.color.text.muted};

  ${({ $plate, $outline }) =>
    ($plate || $outline) &&
    `
    &::before {
      content: '';
      width: 14px;
      height: 2px;
      flex-shrink: 0;
      background-color: currentColor;
      opacity: 0.7;
    }
  `}
`

const RowValue = styled.span<{ $plate: boolean; $tone: StatCardTone }>`
  margin-left: auto;
  min-width: 0;
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.tight};
  font-variant-numeric: tabular-nums;
  text-align: right;
  overflow-wrap: anywhere;
  color: ${({ theme, $plate, $tone }) => ($plate ? theme.color.text.inverse : paint(theme, $tone))};
`

const RowTexts = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`

const RowLabelRow = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
`

export function StatCard({
  label,
  value,
  caption,
  tone = 'neutral',
  icon,
  valueScale = 'large',
  orientation = 'column',
  panel = false,
  outline = false,
  badge,
}: StatCardProps) {
  const plate = panel || outline

  if (orientation === 'row') {
    return (
      <Container $tone={tone} $row $panel={panel} $outline={outline}>
        {!plate && <Marker $tone={tone} aria-hidden="true" />}
        {icon && (
          <IconChip $tone={tone} $plate={panel} aria-hidden="true">
            {icon}
          </IconChip>
        )}
        <RowTexts>
          <RowLabelRow>
            <Label $plate={panel} $outline={outline} $tone={tone}>
              {label}
            </Label>
            {badge && <BadgeSlot>{badge}</BadgeSlot>}
          </RowLabelRow>
          {caption !== undefined && (
            <Caption $plate={panel} $outline={outline} $tone={tone}>
              {caption}
            </Caption>
          )}
        </RowTexts>
        <RowValue $plate={panel} $tone={tone}>
          {value}
        </RowValue>
      </Container>
    )
  }

  return (
    <Container $tone={tone} $row={false} $panel={panel} $outline={outline}>
      <TopRow $plate={plate} $tone={tone}>
        {!plate && <Marker $tone={tone} aria-hidden="true" />}
        {icon && (
          <IconChip $tone={tone} $plate={panel} aria-hidden="true">
            {icon}
          </IconChip>
        )}
        <Label $plate={panel} $outline={outline} $tone={tone}>
          {label}
        </Label>
        {badge && <BadgeSlot>{badge}</BadgeSlot>}
      </TopRow>
      <Value $scale={valueScale} $plate={panel} $tone={tone}>
        {value}
      </Value>
      {caption !== undefined && (
        <Caption $plate={panel} $outline={outline} $tone={tone}>
          {caption}
        </Caption>
      )}
    </Container>
  )
}
