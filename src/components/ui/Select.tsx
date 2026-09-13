import styled, { css } from 'styled-components'
import type { SelectHTMLAttributes } from 'react'
import { FormField } from './FormField'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: string
  options: SelectOption[]
  error?: string
  hint?: string
  placeholder?: string
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

const Chevron = styled.span`
  position: absolute;
  top: 50%;
  right: ${({ theme }) => theme.space.md};
  display: inline-flex;
  color: ${({ theme }) => theme.color.text.secondary};
  pointer-events: none;
  transform: translateY(-50%);
`

const StyledSelect = styled.select<{ $invalid: boolean }>`
  width: 100%;
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.xl}
    ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border.strong};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.white};
  color: ${({ theme }) => theme.color.text.primary};
  font: inherit;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
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

  ${({ $invalid, theme }) =>
    $invalid &&
    css`
      border-color: ${theme.color.status.danger.text};

      &:focus {
        box-shadow: 0 0 0 3px ${theme.color.focus.dangerGlow};
      }
    `}
`

export function Select({
  id,
  label,
  options,
  error,
  hint,
  required,
  placeholder,
  children,
  ...rest
}: SelectProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')
  return (
    <FormField label={label} inputId={id} error={error} hint={hint} required={required}>
      <Wrapper>
        <StyledSelect
          id={id}
          $invalid={Boolean(error)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          required={required}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </StyledSelect>
        <Chevron aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Chevron>
      </Wrapper>
    </FormField>
  )
}
