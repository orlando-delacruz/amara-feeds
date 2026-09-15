import styled from 'styled-components'
import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/navigation/BottomNav'
import { SideNav } from '@/components/navigation/SideNav'
import { TopBar } from '@/components/navigation/TopBar'
import type { NavItem } from '@/components/navigation/navItems'
import { useSession } from '@/features/session/useSession'
import { useHistoryUnread } from '@/features/history/useHistoryUnread'

interface AppShellProps {
  sectionLabel: string
  navItems: NavItem[]
  brand: 'store' | 'dual'
}

const Shell = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    grid-template-columns: 15rem 1fr;
    grid-template-rows: auto 1fr;
  }
`

const SkipLink = styled.a`
  position: absolute;
  left: ${({ theme }) => theme.space.lg};
  top: -100px;
  z-index: 100;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  background-color: ${({ theme }) => theme.color.surface.card};
  border-radius: ${({ theme }) => theme.radius.md};

  &:focus {
    top: ${({ theme }) => theme.space.sm};
  }
`

const Content = styled.main`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.lg};
  padding-bottom: calc(
    ${({ theme }) => theme.layout.tabBarHeight} + env(safe-area-inset-bottom, 0px) +
      ${({ theme }) => theme.space.lg}
  );

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    padding-bottom: ${({ theme }) => theme.space.lg};
  }
`

export function AppShell({ sectionLabel, navItems, brand }: AppShellProps) {
  const { user } = useSession()
  const hasUnread = useHistoryUnread(user ?? undefined)
  return (
    <Shell>
      <SkipLink href="#main-content">Skip to content</SkipLink>
      <TopBar sectionLabel={sectionLabel} brand={brand} />
      <SideNav items={navItems} badge={hasUnread ? '•' : undefined} />
      <Content id="main-content" tabIndex={-1}>
        <Outlet />
      </Content>
      <BottomNav items={navItems} />
    </Shell>
  )
}
