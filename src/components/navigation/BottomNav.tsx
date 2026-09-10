import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import type { NavItem } from './navItems'

interface BottomNavProps {
  items: NavItem[]
}

const Bar = styled.nav`
  position: sticky;
  bottom: 0;
  z-index: ${({ theme }) => theme.zIndex.nav};
  background-color: ${({ theme }) => theme.color.surface.card};
  border-top: 1px solid ${({ theme }) => theme.color.border.default};

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    display: none;
  }
`

const List = styled.ul`
  display: flex;
  overflow-x: auto;
  list-style: none;
  max-width: 72rem;
  margin: 0 auto;
`

const Item = styled.li`
  flex: 1 0 auto;
`

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.secondary};
  text-decoration: none;
  white-space: nowrap;
  border-top: 3px solid transparent;

  &.active {
    color: ${({ theme }) => theme.color.brand[700]};
    border-top-color: ${({ theme }) => theme.color.brand[600]};
  }
`

export function BottomNav({ items }: BottomNavProps) {
  return (
    <Bar aria-label="Primary">
      <List>
        {items.map((item) => (
          <Item key={item.to}>
            <StyledNavLink to={item.to} end={item.to === '/dashboard' || item.to === '/admin'}>
              {item.label}
            </StyledNavLink>
          </Item>
        ))}
      </List>
    </Bar>
  )
}
