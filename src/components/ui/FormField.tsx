import styled from 'styled-components'
import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  inputId: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
`

const RequiredMark = styled.span`
  color: ${({ theme }) => theme.color.status.danger.text};
  margin-left: ${({ theme }) => theme.space.xs};
`

const Hint = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
`

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.status.danger.text};
`

export function FormField({
  label,
  inputId,
  error,
  hint,
  required = false,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  return (
    <Wrapper>
      <Label htmlFor={inputId}>
        {label}
        {required && <RequiredMark aria-hidden="true">*</RequiredMark>}
      </Label>
      {children}
      {hint && <Hint id={hintId}>{hint}</Hint>}
      {error && (
        <ErrorText id={errorId} role="alert">
          {error}
        </ErrorText>
      )}
    </Wrapper>
  )
}
