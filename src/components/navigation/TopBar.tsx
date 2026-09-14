import styled from 'styled-components'
import { Link, useNavigate } from 'react-router-dom'
import { StoreBadge } from '@/components/ui/StoreBadge'
import { getDisplayName } from '@/features/session/displayName'
import { useSession } from '@/features/session/useSession'
import { useStore } from '@/store/useStore'

interface TopBarProps {
  sectionLabel: string
}

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  grid-column: 1 / -1;
  padding-top: env(safe-area-inset-top, 0px);
  background-color: ${({ theme }) => theme.color.surface.card};
  border-bottom: 1px solid ${({ theme }) => theme.color.border.default};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`

const Inner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  min-height: ${({ theme }) => theme.layout.headerHeight};
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  padding-left: max(${({ theme }) => theme.space.lg}, env(safe-area-inset-left, 0px));
  padding-right: max(${({ theme }) => theme.space.lg}, env(safe-area-inset-right, 0px));
`

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.brand[600]};
  color: ${({ theme }) => theme.color.text.inverse};
  text-decoration: none;
  white-space: nowrap;
  min-width: 0;
  flex-shrink: 1;
  overflow: hidden;

  &:hover {
    background-color: ${({ theme }) => theme.color.brand[700]};
  }
`

const BrandName = styled.span`
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  overflow: hidden;
  text-overflow: ellipsis;
`

const BrandMark = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
`

const BrandChip = styled.span<{ $color: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.sm};
  background-color: ${({ $color }) => $color};
  border: 1px solid rgba(255, 255, 255, 0.55);
`

const SectionTag = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  color: ${({ theme }) => theme.color.text.muted};
  white-space: nowrap;
  background-color: ${({ theme }) => theme.color.surface.subtle};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 2px ${({ theme }) => theme.space.sm};

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    display: none;
  }
`

const Spacer = styled.span`
  flex: 1;
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space.sm};
  margin-left: auto;
  min-width: 0;
`

const UserName = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    display: none;
  }
`

const SignOutButton = styled.button`
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.color.brand[700]};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.color.brand[50]};
  }

  // Sign out lives on the More page on phones, keeping the header a single row.
  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    display: none;
  }
`

export function TopBar({ sectionLabel }: TopBarProps) {
  const { store } = useStore()
  const { user, signOut } = useSession()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/sign-in', { replace: true })
  }

  return (
    <Header>
      <Inner>
        <Brand to="/" translate="no">
          <BrandMark aria-hidden="true">
            <BrandChip $color="#5a3fa6" />
            <BrandChip $color="#b6450f" />
          </BrandMark>
          <BrandName>Amara Feeds</BrandName>
        </Brand>
        <SectionTag>{sectionLabel}</SectionTag>
        <Spacer />
        <Controls>
          <StoreBadge store={store} />
          {user && <UserName>{getDisplayName(user.name)}</UserName>}
          <SignOutButton type="button" onClick={handleSignOut}>
            Sign out
          </SignOutButton>
        </Controls>
      </Inner>
    </Header>
  )
}
