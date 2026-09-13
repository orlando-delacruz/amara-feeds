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
  top: calc(${({ theme }) => theme.layout.headerHeight} + ${({ theme }) => theme.space.md});
`

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radius.md};
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.secondary};
  text-decoration: none;
  transition:
    background-color ${({ theme }) => theme.motion.fast} ease-out,
    color ${({ theme }) => theme.motion.fast} ease-out;

  &:hover {
    background-color: ${({ theme }) => theme.color.surface.subtle};
    color: ${({ theme }) => theme.color.text.primary};
  }

  &.active {
    background-color: ${({ theme }) => theme.color.brand[600]};
    color: ${({ theme }) => theme.color.text.inverse};
    font-weight: ${({ theme }) => theme.font.weight.bold};
    box-shadow: ${({ theme }) => theme.shadow.paint};
  }
`

const Marker = styled.span`
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.sm};
  background-color: ${({ theme }) => theme.color.neutral[300]};
`

export function SideNav({ items }: SideNavProps) {
  return (
    <Aside aria-label="Primary">
      <List>
        {items.map((item) => (
          <li key={item.to}>
            <StyledNavLink to={item.to} end={item.to === '/dashboard' || item.to === '/admin'}>
              {({ isActive }) => (
                <>
                  {!isActive && <Marker aria-hidden="true" />}
                  {item.label}
                </>
              )}
            </StyledNavLink>
          </li>
        ))}
      </List>
    </Aside>
  )
}