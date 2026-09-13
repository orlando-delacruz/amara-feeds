import styled, { css } from 'styled-components'
import type { InputHTMLAttributes } from 'react'
import { FormField } from './FormField'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  hint?: string
}

const StyledInput = styled.input<{ $invalid: boolean }>`
  width: 100%;
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border.strong};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.white};
  color: ${({ theme }) => theme.color.text.primary};
  font: inherit;
  color-scheme: light;
  transition:
    border-color ${({ theme }) => theme.motion.fast} ease-out,
    box-shadow ${({ theme }) => theme.motion.fast} ease-out;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color.neutral[300]};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.brand[600]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.color.focus.glow};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.color.neutral[100]};
    color: ${({ theme }) => theme.color.text.muted};
    cursor: not-allowed;
  }

  &::placeholder {
    color: ${({ theme }) => theme.color.text.muted};
  }

  &[type='date'],
  &[type='time'],
  &[type='datetime-local'] {
    cursor: pointer;
    font-variant-numeric: tabular-nums;
  }

  &::-webkit-calendar-picker-indicator {
    width: 20px;
    height: 20px;
    margin-left: ${({ theme }) => theme.space.sm};
    padding: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;
    opacity: 0.65;
  }

  &:hover:not(:disabled)::-webkit-calendar-picker-indicator {
    opacity: 1;
  }

  ${({ $invalid, theme }) =>
    $invalid &&
    css`
      border-color: ${theme.color.status.danger.text};

      &:focus {
        box-shadow: 0 0 0 3px ${theme.color.focus.dangerGlow};
      }
    `}
`

export function TextField({ id, label, error, hint, required, ...rest }: TextFieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')
  return (
    <FormField label={label} inputId={id} error={error} hint={hint} required={required}>
      <StyledInput
        id={id}
        $invalid={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        required={required}
        {...rest}
      />
    </FormField>
  )
}
