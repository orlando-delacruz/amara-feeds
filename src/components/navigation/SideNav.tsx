import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import type { NavItem } from './navItems'

interface SideNavProps {
  items: NavItem[]
}

const Aside = styled.nav`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    display: block;
    background-color: ${({ theme }) => theme.color.surface.card};
    border-right: 1px solid ${({ theme }) => theme.color.border.default};
    padding: ${({ theme }) => theme.space.lg} ${({ theme }) => theme.space.md};
  }
`

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  list-style: none;
  position: sticky;
  top: 72px;
`

const StyledNavLink = styled(NavLink)`
  display: block;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.secondary};
  text-decoration: none;

  &:hover {
    background-color: ${({ theme }) => theme.color.neutral[100]};
  }

  &.active {
    background-color: ${({ theme }) => theme.color.brand[50]};
    color: ${({ theme }) => theme.color.brand[700]};
    font-weight: ${({ theme }) => theme.font.weight.semibold};
  }
`

export function SideNav({ items }: SideNavProps) {
  return (
    <Aside aria-label="Primary">
      <List>
        {items.map((item) => (
          <li key={item.to}>
            <StyledNavLink to={item.to} end={item.to === '/dashboard' || item.to === '/admin'}>
              {item.label}
            </StyledNavLink>
          </li>
        ))}
      </List>
    </Aside>
  )
}
