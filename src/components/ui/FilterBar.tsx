import styled from 'styled-components'
import type { ReactNode } from 'react'

interface FilterBarProps {
  children: ReactNode
}

const Bar = styled.div`
  position: sticky;
  top: calc(${({ theme }) => theme.layout.headerHeight} + env(safe-area-inset-top, 0px));
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  margin: 0 calc(-1 * ${({ theme }) => theme.space.lg});
  background-color: ${({ theme }) => theme.color.surface.page};
  border-bottom: 1px solid ${({ theme }) => theme.color.border.default};
  box-shadow: 0 2px 8px rgba(13, 32, 52, 0.04);
`

export function FilterBar({ children }: FilterBarProps) {
  return <Bar>{children}</Bar>
}
