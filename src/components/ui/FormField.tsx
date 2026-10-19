import styled from 'styled-components'
import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  inputId: string
  /**
   * Set when the child is not a native form control — DatePicker's trigger is
   * a <button>. A `<label htmlFor>` wins the accessible-name calculation, so it
   * would replace the button's own content with just the label and hide the
   * selected date from screen readers. The label then renders as text and the
   * child points at it with `aria-labelledby={`${inputId}-label`}` (plus its own
   * value element, so the name still contains the visible label — WCAG 2.5.3).
   */
  labelAsText?: boolean
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
  labelAsText = false,
  error,
  hint,
  required = false,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const mark = (
    <>
      {label}
      {required && <RequiredMark aria-hidden="true">*</RequiredMark>}
    </>
  )
  return (
    <Wrapper>
      {labelAsText ? (
        <Label as="span" id={`${inputId}-label`}>
          {mark}
        </Label>
      ) : (
        <Label htmlFor={inputId}>{mark}</Label>
      )}
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
