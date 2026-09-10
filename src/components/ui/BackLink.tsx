import styled from 'styled-components'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface BackLinkProps {
  to: string
  children: ReactNode
}

const StyledLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
  min-height: ${({ theme }) => theme.touch.minTarget};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.brand[700]};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.radius.md};

  &:hover {
    text-decoration: underline;
  }
`

export function BackLink({ to, children }: BackLinkProps) {
  return (
    <StyledLink to={to}>
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
      {children}
    </StyledLink>
  )
}
