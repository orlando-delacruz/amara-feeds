import { useEffect, useId, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { FormField } from './FormField'
import { Icon } from './icons'
import { toDateOnly } from '@/lib/dates'
import { formatDate } from '@/lib/format'

export interface DatePickerProps {
  id: string
  label: string
  /** Selected day as `YYYY-MM-DD`. */
  value: string
  onChange: (value: string) => void
  required?: boolean
  hint?: string
  error?: string
  min?: string
  max?: string
}

const Wrapper = styled.div`
  position: relative;
`

const FieldButton = styled.button<{ $invalid: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  width: 100%;
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border.strong};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.white};
  color: ${({ theme }) => theme.color.text.primary};
  font: inherit;
  font-variant-numeric: tabular-nums;
  text-align: left;
  cursor: pointer;
  transition:
    border-color ${({ theme }) => theme.motion.fast} ease-out,
    box-shadow ${({ theme }) => theme.motion.fast} ease-out;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color.neutral[300]};
  }

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.color.brand[600]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.color.focus.glow};
  }

  ${({ $invalid, theme }) =>
    $invalid &&
    css`
      border-color: ${theme.color.status.danger.text};

      &:focus-visible {
        box-shadow: 0 0 0 3px ${theme.color.focus.dangerGlow};
      }
    `}
`

const FieldIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.brand[50]};
  color: ${({ theme }) => theme.color.brand[700]};
`

const FieldValue = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Calendar = styled.div`
  position: fixed;
  z-index: ${({ theme }) => theme.zIndex.dialog};
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(340px, calc(100vw - 32px));
  max-height: min(520px, calc(100dvh - 32px));
  overflow: auto;
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    position: absolute;
    left: auto;
    right: 0;
    top: calc(100% + ${({ theme }) => theme.space.sm});
    transform: none;
    max-height: none;
    overflow: hidden;
  }
`

const CalendarHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  background-color: ${({ theme }) => theme.color.brand[600]};
  border-bottom: 3px solid ${({ theme }) => theme.color.brand[700]};
  color: ${({ theme }) => theme.color.text.inverse};
`

const MonthLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  font-variant-numeric: tabular-nums;
`

const NavButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: rgba(255, 255, 255, 0.12);
  color: ${({ theme }) => theme.color.text.inverse};
  font-size: ${({ theme }) => theme.font.size.xl};
  line-height: 1;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.motion.fast} ease-out;

  &:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.22);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.text.inverse};
    outline-offset: 2px;
  }
`

const CalendarBody = styled.div`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md}
    ${({ theme }) => theme.space.md};
`

const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`

const WeekName = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.muted};
`

const DayButton = styled.button<{ $selected: boolean; $today: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.color.brand[600] : 'transparent'};
  color: ${({ theme, $selected }) =>
    $selected ? theme.color.text.inverse : theme.color.text.primary};
  font: inherit;
  font-size: ${({ theme }) => theme.font.size.md};
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.motion.fast} ease-out;

  &:hover:not(:disabled) {
    background-color: ${({ theme, $selected }) =>
      $selected ? theme.color.brand[700] : theme.color.surface.subtle};
  }

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.color.brand[600]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.color.focus.glow};
  }

  &:disabled {
    color: ${({ theme }) => theme.color.text.muted};
    opacity: 0.45;
    cursor: not-allowed;
  }

  ${({ theme, $today, $selected }) =>
    $today &&
    !$selected &&
    css`
      border-color: ${theme.color.brand[600]};
    `}

  ${({ $today, $selected }) =>
    $today &&
    $selected &&
    css`
      &::after {
        content: '';
        position: absolute;
        bottom: 6px;
        width: 5px;
        height: 5px;
        border-radius: 9999px;
        background-color: currentColor;
      }
    `}
`

const DayPlaceholder = styled.span`
  min-height: 44px;
`

const CalendarFoot = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0 ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.md};
`

const TodayButton = styled.button`
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: transparent;
  color: ${({ theme }) => theme.color.text.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.color.surface.subtle};
  }

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.color.brand[600]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.color.focus.glow};
  }
`

const WEEK_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseDay(value: string): { year: number; month: number; day: number } {
  const parsed = new Date(`${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
  }
  return { year: parsed.getFullYear(), month: parsed.getMonth(), day: parsed.getDate() }
}

function monthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  })
}

export function DatePicker({
  id,
  label,
  value,
  onChange,
  required = false,
  hint,
  error,
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseDay(value || toDateOnly(new Date()))
  const [viewYear, setViewYear] = useState(selected.year)
  const [viewMonth, setViewMonth] = useState(selected.month)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLButtonElement>(null)
  const dialogId = useId()

  useEffect(() => {
    if (!open) {
      return
    }
    const current = parseDay(value || toDateOnly(new Date()))
    setViewYear(current.year)
    setViewMonth(current.month)

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        fieldRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, value])

  const today = toDateOnly(new Date())
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: Array<{ day: number; dateOnly: string } | null> = []
  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, dateOnly: toDateOnly(new Date(viewYear, viewMonth, day, 12)) })
  }

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  function choose(dateOnly: string) {
    onChange(dateOnly)
    setOpen(false)
    fieldRef.current?.focus()
  }

  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <FormField label={label} inputId={id} error={error} hint={hint} required={required}>
      <Wrapper ref={wrapperRef}>
        <FieldButton
          ref={fieldRef}
          id={id}
          type="button"
          $invalid={Boolean(error)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={dialogId}
          onClick={() => setOpen((current) => !current)}
        >
          <FieldIcon aria-hidden="true">
            <Icon name="calendar" />
          </FieldIcon>
          <FieldValue>{value ? formatDate(`${value}T12:00:00`) : 'Select a date'}</FieldValue>
        </FieldButton>
        {open && (
          <Calendar
            id={dialogId}
            role="dialog"
            aria-modal="false"
            aria-label={`${label} calendar`}
          >
            <CalendarHead>
              <NavButton type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
                ‹
              </NavButton>
              <MonthLabel>{monthTitle(viewYear, viewMonth)}</MonthLabel>
              <NavButton type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>
                ›
              </NavButton>
            </CalendarHead>
            <CalendarBody>
              <WeekRow aria-hidden="true">
                {WEEK_NAMES.map((name) => (
                  <WeekName key={name}>{name}</WeekName>
                ))}
              </WeekRow>
              <WeekRow role="grid" aria-label={monthTitle(viewYear, viewMonth)}>
                {cells.map((cell, index) =>
                  cell === null ? (
                    <DayPlaceholder key={`gap-${index}`} />
                  ) : (
                    <DayButton
                      key={cell.dateOnly}
                      type="button"
                      role="gridcell"
                      $selected={cell.dateOnly === value}
                      $today={cell.dateOnly === today}
                      aria-selected={cell.dateOnly === value}
                      aria-label={formatDate(`${cell.dateOnly}T12:00:00`)}
                      disabled={Boolean(
                        (min && cell.dateOnly < min) || (max && cell.dateOnly > max),
                      )}
                      onClick={() => choose(cell.dateOnly)}
                    >
                      {cell.day}
                    </DayButton>
                  ),
                )}
              </WeekRow>
            </CalendarBody>
            <CalendarFoot>
              <TodayButton type="button" onClick={() => choose(today)}>
                Today
              </TodayButton>
            </CalendarFoot>
          </Calendar>
        )}
      </Wrapper>
    </FormField>
  )
}
