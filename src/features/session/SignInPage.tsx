import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { listUsers } from '@/services'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { StoreBadge } from '@/components/ui/StoreBadge'
import { useAsyncData } from '@/features/shared'
import { getDisplayName } from './displayName'
import { useSession } from './useSession'
import type { User } from '@/domain'

type AvatarTone = 'amara' | 'zeann' | 'admin' | 'neutral'

const Page = styled.main`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background-color: ${({ theme }) => theme.color.surface.page};

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    padding: ${({ theme }) =>
      `calc(${theme.space.lg} + env(safe-area-inset-top, 0px)) calc(${theme.space.lg} + env(safe-area-inset-right, 0px)) calc(${theme.space.lg} + env(safe-area-inset-bottom, 0px)) calc(${theme.space.lg} + env(safe-area-inset-left, 0px))`};
  }
`

const Shell = styled.div`
  width: 100%;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 1fr;
  overflow: hidden;
  background-color: ${({ theme }) => theme.color.surface.card};

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    min-height: auto;
    max-width: 60rem;
    border: 1px solid ${({ theme }) => theme.color.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: ${({ theme }) => theme.shadow.md};
    grid-template-columns: 5fr 6fr;
  }
`

const BrandPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.xl};
  background-color: ${({ theme }) => theme.color.neutral[900]};
  color: ${({ theme }) => theme.color.text.inverse};

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    padding: ${({ theme }) => theme.space.xxxl};
  }
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.size.xxl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  text-wrap: balance;

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    font-size: 32px;
  }
`

const Subtitle = styled.p`
  color: ${({ theme }) => theme.color.text.inverse};
  opacity: 0.75;
`

const StoreStrip = styled.div`
  display: flex;
  height: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.sm};
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.full};
`

const StoreStripHalf = styled.span<{ $store: 'amara' | 'zeann' }>`
  flex: 1;
  background-color: ${({ theme, $store }) => theme.color.store[$store].solid};
`

const StoreCaption = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.inverse};
  opacity: 0.75;
`

const AccountPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.xl};

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    padding: ${({ theme }) => theme.space.xxxl};
  }
`

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  text-wrap: balance;
`

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  list-style: none;
`

const AccountButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.md};
  text-align: left;
  background-color: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.border.strong};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition:
    background-color ${({ theme }) => theme.motion.fast} ease-out,
    border-color ${({ theme }) => theme.motion.fast} ease-out,
    box-shadow ${({ theme }) => theme.motion.fast} ease-out;

  &:hover {
    background-color: ${({ theme }) => theme.color.neutral[50]};
    border-color: ${({ theme }) => theme.color.brand[600]};
    box-shadow: ${({ theme }) => theme.shadow.sm};
  }

  &:active {
    background-color: ${({ theme }) => theme.color.neutral[100]};
    box-shadow: none;
  }
`

const Avatar = styled.span<{ $tone: AvatarTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme, $tone }) =>
    $tone === 'admin'
      ? theme.color.brand[50]
      : $tone === 'neutral'
        ? theme.color.neutral[100]
        : theme.color.store[$tone].background};
  color: ${({ theme, $tone }) =>
    $tone === 'admin'
      ? theme.color.brand[700]
      : $tone === 'neutral'
        ? theme.color.text.secondary
        : theme.color.store[$tone].text};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.bold};
`

const AccountText = styled.span`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  flex: 1;
  min-width: 0;
`

const AccountName = styled.span`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  overflow-wrap: break-word;
`

const AccountContext = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`

const AccountMeta = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
`

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme }) => theme.color.brand[100]};
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.color.brand[50]};
  color: ${({ theme }) => theme.color.brand[700]};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  white-space: nowrap;
`

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  const initials =
    parts.length > 1
      ? `${parts[0]?.slice(0, 1) ?? ''}${parts[parts.length - 1]?.slice(0, 1) ?? ''}`
      : (parts[0]?.slice(0, 2) ?? '')
  return initials.toUpperCase() || '?'
}

function getAvatarTone(user: User): AvatarTone {
  if (user.role === 'admin') {
    return 'admin'
  }
  return user.storeId ?? 'neutral'
}

export function SignInPage() {
  const { signIn } = useSession()
  const navigate = useNavigate()
  const { data: users, loading, error, reload } = useAsyncData(() => listUsers())

  function handleSignIn(user: User) {
    signIn(user)
    navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
  }

  return (
    <Page>
      <Shell>
        <BrandPanel>
          <div>
            <Title>Amara Feeds</Title>
            <Subtitle>Store management for Amara and Zeann.</Subtitle>
          </div>
          <div>
            <StoreStrip aria-hidden="true">
              <StoreStripHalf $store="amara" />
              <StoreStripHalf $store="zeann" />
            </StoreStrip>
          </div>
          <StoreCaption>Two stores, one shared system.</StoreCaption>
        </BrandPanel>
        <AccountPanel>
          <SectionTitle>Choose your account</SectionTitle>
          {loading && <LoadingState text="Loading accounts…" />}
          {error && <ErrorState description={error} onRetry={reload} />}
          {!loading && !error && users && users.length === 0 && (
            <EmptyState title="No accounts" description="No accounts are available." />
          )}
          {!loading && !error && users && users.length > 0 && (
            <List>
              {users.map((user) => {
                const displayName = getDisplayName(user.name)
                return (
                  <li key={user.id}>
                    <AccountButton type="button" onClick={() => handleSignIn(user)}>
                      <Avatar $tone={getAvatarTone(user)} aria-hidden="true">
                        {getInitials(displayName)}
                      </Avatar>
                      <AccountText>
                        <AccountName>{displayName}</AccountName>
                        <AccountContext>
                          {user.role === 'admin' ? (
                            <>
                              <RoleBadge>Admin</RoleBadge>
                              <AccountMeta>Both stores</AccountMeta>
                            </>
                          ) : (
                            <>
                              {user.storeId && <StoreBadge store={user.storeId} />}
                              <AccountMeta>Staff</AccountMeta>
                            </>
                          )}
                        </AccountContext>
                      </AccountText>
                    </AccountButton>
                  </li>
                )
              })}
            </List>
          )}
        </AccountPanel>
      </Shell>
    </Page>
  )
}
