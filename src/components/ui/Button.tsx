import styled, { css } from 'styled-components'
import type { ButtonHTMLAttributes, Ref } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  ref?: Ref<HTMLButtonElement>
}

const sizeStyles: Record<ButtonSize, ReturnType<typeof css>> = {
  sm: css`
    font-size: ${({ theme }) => theme.font.size.sm};
    padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  `,
  md: css`
    font-size: ${({ theme }) => theme.font.size.md};
    padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  `,
  lg: css`
    font-size: ${({ theme }) => theme.font.size.lg};
    padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.xl};
  `,
}

const variantStyles: Record<ButtonVariant, ReturnType<typeof css>> = {
  primary: css`
    background-color: ${({ theme }) => theme.color.brand[600]};
    color: ${({ theme }) => theme.color.text.inverse};
    box-shadow: ${({ theme }) => theme.shadow.paint};

    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.color.brand[700]};
      box-shadow:
        0 3px 8px rgba(21, 60, 110, 0.3),
        0 8px 20px rgba(30, 78, 140, 0.22);
    }

    &:active:not(:disabled) {
      transform: translateY(0.5px);
      box-shadow: ${({ theme }) => theme.shadow.paint};
    }
  `,
  secondary: css`
    background-color: ${({ theme }) => theme.color.surface.card};
    color: ${({ theme }) => theme.color.text.primary};
    border: 2px solid ${({ theme }) => theme.color.border.strong};
    box-shadow: 0 1px 2px rgba(33, 31, 24, 0.05);

    &:hover:not(:disabled) {
      border-color: ${({ theme }) => theme.color.brand[600]};
      color: ${({ theme }) => theme.color.brand[700]};
      box-shadow: 0 2px 6px rgba(33, 31, 24, 0.07);
    }

    &:active:not(:disabled) {
      transform: translateY(0.5px);
    }
  `,
  subtle: css`
    background-color: transparent;
    color: ${({ theme }) => theme.color.brand[700]};

    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.color.brand[50]};
    }
  `,
  danger: css`
    background-color: ${({ theme }) => theme.color.status.danger.text};
    color: ${({ theme }) => theme.color.text.inverse};
    box-shadow: 0 2px 6px rgba(169, 42, 29, 0.25);

    &:hover:not(:disabled) {
      filter: brightness(0.92);
      box-shadow: 0 4px 12px rgba(169, 42, 29, 0.3);
    }

    &:active:not(:disabled) {
      transform: translateY(0.5px);
    }
  `,
}

const StyledButton = styled.button<{
  $variant: ButtonVariant
  $size: ButtonSize
  $fullWidth: boolean
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space.sm};
  min-height: ${({ theme }) => theme.touch.minTarget};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  cursor: pointer;
  transition:
    background-color ${({ theme }) => theme.motion.fast} ease-out,
    box-shadow ${({ theme }) => theme.motion.fast} ease-out,
    transform ${({ theme }) => theme.motion.fast} ease-out;
  ${({ $size }) => sizeStyles[$size]}
  ${({ $variant }) => variantStyles[$variant]}
  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  ref,
  children,
  ...rest
}: ButtonProps) {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      type={type}
      ref={ref}
      {...rest}
    >
      {children}
    </StyledButton>
  )
}