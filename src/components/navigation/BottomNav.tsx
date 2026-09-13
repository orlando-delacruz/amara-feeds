import styled, { css } from 'styled-components'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { NavItem } from './navItems'
import { NavIcon } from './icons'

interface BottomNavProps {
  items: NavItem[]
}

const Bar = styled.nav`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: ${({ theme }) => theme.zIndex.nav};
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: max(${({ theme }) => theme.space.md}, env(safe-area-inset-left, 0px));
  padding-right: max(${({ theme }) => theme.space.md}, env(safe-area-inset-right, 0px));
  background-color: ${({ theme }) => theme.color.surface.card};
  border-top: 1px solid ${({ theme }) => theme.color.border.default};
  box-shadow: 0 -2px 10px rgba(33, 31, 26, 0.06);

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    display: none;
  }
`

const List = styled.ul`
  display: flex;
  justify-content: center;
  list-style: none;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 0;
`

const Item = styled.li`
  flex: 1 1 0;
  min-width: 0;
  max-width: 6.5rem;
`

const tabLinkStyles = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  min-height: ${({ theme }) => theme.layout.tabBarHeight};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.xs};
  font-size: ${({ theme }) => theme.font.size.xs};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.muted};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.radius.md} ${({ theme }) => theme.radius.md} 0 0;

  &.active {
    color: ${({ theme }) => theme.color.brand[700]};
    font-weight: ${({ theme }) => theme.font.weight.semibold};
    background-color: ${({ theme }) => theme.color.brand[50]};
  }
`

const TabLink = styled(NavLink)`
  ${tabLinkStyles}
`

// The More tab covers several overflow destinations, so its active state is
// computed manually (moreActive). NavLink would overwrite a manual
// aria-current when inactive, hence a plain Link here.
const MoreTabLink = styled(Link)`
  ${tabLinkStyles}
`

const Label = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
`

function isTabActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`)
}

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}

export function BottomNav({ items }: BottomNavProps) {
  const { pathname } = useLocation()
  const primary = items.filter((item) => item.primary)
  const overflow = items.filter((item) => !item.primary)
  const base = primary[0]?.to === '/admin' ? '/admin/more' : '/more'
  const moreActive = pathname === base || overflow.some((item) => isTabActive(pathname, item.to))

  return (
    <Bar aria-label="Primary">
      <List>
        {primary.map((item) => (
          <Item key={item.to}>
            <TabLink to={item.to} end={item.to === '/dashboard' || item.to === '/admin'}>
              <NavIcon name={item.icon} />
              <Label>{item.label}</Label>
            </TabLink>
          </Item>
        ))}
        <Item>
          <MoreTabLink
            to={base}
            className={moreActive ? 'active' : undefined}
            aria-current={moreActive ? 'page' : undefined}
          >
            <MoreIcon />
            <Label>More</Label>
          </MoreTabLink>
        </Item>
      </List>
    </Bar>
  )
}
