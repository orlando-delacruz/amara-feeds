import styled, { css } from 'styled-components'
import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { FormField } from './FormField'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  hint?: string
}

const InputWrap = styled.span`
  position: relative;
  display: block;
`

const StyledInput = styled.input<{ $invalid: boolean; $toggle: boolean }>`
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

  ${({ $toggle, theme }) =>
    $toggle &&
    css`
      padding-right: calc(${theme.space.xl} + ${theme.space.md} + 44px);
    `}

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

const Toggle = styled.button`
  position: absolute;
  top: 50%;
  right: ${({ theme }) => theme.space.sm};
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: transparent;
  color: ${({ theme }) => theme.color.text.muted};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color.text.secondary};
    background-color: ${({ theme }) => theme.color.surface.subtle};
    border-radius: ${({ theme }) => theme.radius.sm};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.color.focus.glow};
    border-radius: ${({ theme }) => theme.radius.sm};
  }
`

function EyeIcon({ closed }: { closed: boolean }) {
  return closed ? (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.4 10.4 0 0 1 12 19.5C5 19.5 2 12 2 12a17.6 17.6 0 0 1 4.06-5.44M9.9 5.06A9.5 9.5 0 0 1 12 4.5c7 0 10 7.5 10 7.5a17.7 17.7 0 0 1-2.4 3.6" />
      <path d="M3 3l18 18" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    </svg>
  ) : (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7.5 10-7.5S22 12 22 12s-3 7.5-10 7.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function TextField({ id, label, error, hint, required, ...rest }: TextFieldProps) {
  const isPassword = rest.type === 'password'
  const [revealed, setRevealed] = useState(false)
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')
  return (
    <FormField label={label} inputId={id} error={error} hint={hint} required={required}>
      <InputWrap>
        <StyledInput
          id={id}
          $invalid={Boolean(error)}
          $toggle={isPassword}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          required={required}
          {...rest}
          type={isPassword && revealed ? 'text' : rest.type}
        />
        {isPassword && (
          <Toggle
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-pressed={revealed}
            aria-label={revealed ? 'Hide password' : 'Show password'}
          >
            <EyeIcon closed={revealed} />
          </Toggle>
        )}
      </InputWrap>
    </FormField>
  )
}
