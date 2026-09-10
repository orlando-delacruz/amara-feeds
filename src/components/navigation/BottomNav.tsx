import { useState } from 'react'
import styled from 'styled-components'
import { NavLink, useLocation } from 'react-router-dom'
import type { NavItem } from './navItems'
import { MoreSheet } from './MoreSheet'
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
  background-color: ${({ theme }) => theme.color.surface.card};
  border-top: 1px solid ${({ theme }) => theme.color.border.default};
  box-shadow: ${({ theme }) => theme.shadow.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    display: none;
  }
`

const List = styled.ul`
  display: flex;
  list-style: none;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
`

const Item = styled.li`
  flex: 1 1 0;
  min-width: 0;
`

const TabLink = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: ${({ theme }) => theme.layout.tabBarHeight};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.xs};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.secondary};
  text-decoration: none;

  &.active {
    color: ${({ theme }) => theme.color.brand[700]};
    font-weight: ${({ theme }) => theme.font.weight.semibold};
  }
`

const MoreButton = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  min-height: ${({ theme }) => theme.layout.tabBarHeight};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.xs};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme, $active }) => ($active ? theme.color.brand[700] : theme.color.text.secondary)};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.font.weight.semibold : theme.font.weight.medium};
  cursor: pointer;
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
  const [moreOpen, setMoreOpen] = useState(false)
  const { pathname } = useLocation()
  const primary = items.filter((item) => item.primary)
  const overflow = items.filter((item) => !item.primary)
  const moreActive = overflow.some((item) => isTabActive(pathname, item.to))

  return (
    <>
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
            <MoreButton
              type="button"
              $active={moreActive}
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
              onClick={() => setMoreOpen(true)}
            >
              <MoreIcon />
              <Label>More</Label>
            </MoreButton>
          </Item>
        </List>
      </Bar>
      <MoreSheet open={moreOpen} items={overflow} onClose={() => setMoreOpen(false)} />
    </>
  )
}
