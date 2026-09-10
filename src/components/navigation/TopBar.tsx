import styled from 'styled-components'
import { Link, useNavigate } from 'react-router-dom'
import { StoreBadge } from '@/components/ui/StoreBadge'
import { getDisplayName } from '@/features/session/displayName'
import { useSession } from '@/features/session/useSession'
import { storeIds, storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { StoreId } from '@/store/stores'

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
`

const Inner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  min-height: ${({ theme }) => theme.layout.headerHeight};
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
`

const Brand = styled(Link)`
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.color.text.primary};
  text-decoration: none;
  white-space: nowrap;
`

const SectionTag = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.color.text.secondary};
  white-space: nowrap;
`

const Spacer = styled.span`
  flex: 1;
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`

const UserName = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    display: none;
  }
`

const StoreSelect = styled.select`
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme }) => theme.color.border.strong};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.white};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
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
`

export function TopBar({ sectionLabel }: TopBarProps) {
  const { store, setStore, canSwitchStore } = useStore()
  const { user, signOut } = useSession()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/sign-in', { replace: true })
  }

  return (
    <Header>
      <Inner>
        <Brand to="/">Amara Feeds</Brand>
        <SectionTag>{sectionLabel}</SectionTag>
        <Spacer />
        <Controls>
          <StoreBadge store={store} />
          {canSwitchStore && (
            <StoreSelect
              aria-label="Store"
              value={store}
              onChange={(event) => setStore(event.target.value as StoreId)}
            >
              {storeIds.map((id) => (
                <option key={id} value={id}>
                  {storeNames[id]}
                </option>
              ))}
            </StoreSelect>
          )}
          {user && <UserName>{getDisplayName(user.name)}</UserName>}
          <SignOutButton type="button" onClick={handleSignOut}>
            Sign out
          </SignOutButton>
        </Controls>
      </Inner>
    </Header>
  )
}
