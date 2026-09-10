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

const StyledSelect = styled.select<{ $invalid: boolean }>`
  width: 100%;
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border.strong};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.white};

  &:disabled {
    background-color: ${({ theme }) => theme.color.neutral[100]};
    color: ${({ theme }) => theme.color.text.muted};
  }

  ${({ $invalid, theme }) =>
    $invalid &&
    css`
      border-color: ${theme.color.status.danger.text};
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
    </FormField>
  )
}
