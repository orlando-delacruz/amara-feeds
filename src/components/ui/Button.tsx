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
    background: ${({ theme }) => theme.color.brand.gradient};
    color: ${({ theme }) => theme.color.text.inverse};
    box-shadow:
      0 1px 3px rgba(21, 115, 71, 0.2),
      0 1px 2px rgba(21, 115, 71, 0.12);

    &:hover:not(:disabled) {
      box-shadow:
        0 4px 12px rgba(21, 115, 71, 0.28),
        0 2px 4px rgba(21, 115, 71, 0.12);
      filter: brightness(1.06);
    }

    &:active:not(:disabled) {
      transform: translateY(0.5px);
      box-shadow: 0 1px 2px rgba(21, 115, 71, 0.16);
    }
  `,
  secondary: css`
    background-color: ${({ theme }) => theme.color.white};
    color: ${({ theme }) => theme.color.text.primary};
    border: 1px solid ${({ theme }) => theme.color.border.strong};
    box-shadow: 0 1px 2px rgba(33, 31, 26, 0.04);

    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.color.neutral[50]};
      border-color: ${({ theme }) => theme.color.neutral[300]};
      box-shadow: 0 2px 6px rgba(33, 31, 26, 0.06);
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
    box-shadow: 0 1px 3px rgba(153, 27, 27, 0.2);

    &:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(153, 27, 27, 0.28);
      filter: brightness(0.92);
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
