import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import { NavIcon } from './icons'
import type { NavItem } from './navItems'
import { StoreControl } from '@/features/shared'

interface SideNavProps {
  items: NavItem[]
  badge?: string
}

const Aside = styled.nav`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    position: sticky;
    top: ${({ theme }) => theme.layout.headerHeight};
    height: calc(100dvh - ${({ theme }) => theme.layout.headerHeight});
    display: flex;
    flex-direction: column;
    overflow: hidden;
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
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: ${({ theme }) => theme.space.md};
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

  & svg {
    flex-shrink: 0;
  }
`

const Badge = styled.span`
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: auto;
  border-radius: 9999px;
  background-color: ${({ theme }) => theme.color.status.danger.text};
  color: ${({ theme }) => theme.color.text.inverse};
  font-family: ${({ theme }) => theme.font.family};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: 18px;
  text-align: center;
`

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  border-top: 1px solid ${({ theme }) => theme.color.border.default};
  padding-top: ${({ theme }) => theme.space.md};
`

const FooterLabel = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  color: ${({ theme }) => theme.color.text.muted};
`

export function SideNav({ items, badge }: SideNavProps) {
  // My Account and the admin store switch live only on the admin More page
  // (/admin/more), which desktop no longer links to — surface them in the
  // sidebar footer so every destination stays reachable. Staff have neither
  // (locked store, no account page), so they get no footer.
  const isAdmin = items[0]?.to === '/admin'
  return (
    <Aside aria-label="Primary">
      <List>
        {items.map((item) => (
          <li key={item.to}>
            <StyledNavLink to={item.to} end={item.to === '/dashboard' || item.to === '/admin'}>
              <NavIcon name={item.icon} />
              {item.label}
              {badge && item.to === '/history' && <Badge aria-label="Unread">{badge}</Badge>}
            </StyledNavLink>
          </li>
        ))}
      </List>
      {isAdmin ? (
        <Footer>
          <StyledNavLink to="/admin/account">
            <NavIcon name="account" />
            My Account
          </StyledNavLink>
          <FooterLabel>Store context</FooterLabel>
          <StoreControl />
        </Footer>
      ) : undefined}
    </Aside>
  )
}
