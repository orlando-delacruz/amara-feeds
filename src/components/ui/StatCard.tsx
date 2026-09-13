import styled from 'styled-components'
import type { ReactNode } from 'react'

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
}

const Container = styled.div<{ $tone: StatCardTone; $row: boolean }>`
  display: flex;
  flex-direction: ${({ $row }) => ($row ? 'row' : 'column')};
  align-items: ${({ $row }) => ($row ? 'center' : 'stretch')};
  gap: ${({ theme, $row }) => ($row ? theme.space.md : theme.space.xs)};
  padding: ${({ theme }) => theme.space.lg};
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-left: 4px solid
    ${({ theme, $tone }) =>
      $tone === 'brand'
        ? theme.color.brand[600]
        : $tone === 'neutral'
          ? theme.color.border.default
          : (theme.color.store[$tone]?.solid ?? theme.color.border.default)};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`

const TopRow = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`

const IconChip = styled.span<{ $tone: StatCardTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme, $tone }) =>
    $tone === 'brand'
      ? theme.color.brand[50]
      : $tone === 'neutral'
        ? theme.color.surface.subtle
        : (theme.color.store[$tone]?.background ?? theme.color.surface.subtle)};
  color: ${({ theme, $tone }) =>
    $tone === 'brand'
      ? theme.color.brand[700]
      : $tone === 'neutral'
        ? theme.color.text.secondary
        : (theme.color.store[$tone]?.text ?? theme.color.text.secondary)};
`

const Label = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.secondary};
`

const Value = styled.span<{ $scale: StatCardValueScale }>`
  font-size: ${({ theme, $scale }) =>
    $scale === 'hero'
      ? theme.font.size.hero
      : $scale === 'large'
        ? theme.font.size.display
        : theme.font.size.xxl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.tight};
  font-variant-numeric: tabular-nums;
  text-wrap: balance;
`

const Caption = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
`

const RowValue = styled.span`
  margin-left: auto;
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  font-variant-numeric: tabular-nums;
  text-align: right;
`

const RowTexts = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`

export function StatCard({
  label,
  value,
  caption,
  tone = 'neutral',
  icon,
  valueScale = 'large',
  orientation = 'column',
}: StatCardProps) {
  if (orientation === 'row') {
    return (
      <Container $tone={tone} $row>
        {icon && (
          <IconChip $tone={tone} aria-hidden="true">
            {icon}
          </IconChip>
        )}
        <RowTexts>
          <Label>{label}</Label>
          {caption !== undefined && <Caption>{caption}</Caption>}
        </RowTexts>
        <RowValue>{value}</RowValue>
      </Container>
    )
  }
  return (
    <Container $tone={tone} $row={false}>
      <TopRow>
        {icon && (
          <IconChip $tone={tone} aria-hidden="true">
            {icon}
          </IconChip>
        )}
        <Label>{label}</Label>
      </TopRow>
      <Value $scale={valueScale}>{value}</Value>
      {caption !== undefined && <Caption>{caption}</Caption>}
    </Container>
  )
}
