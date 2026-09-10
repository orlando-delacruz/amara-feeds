import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { listUsers } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAsyncData } from '@/features/shared'
import { useSession } from './useSession'
import type { User } from '@/domain'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: ${({ theme }) => theme.space.lg};
  background-color: ${({ theme }) => theme.color.surface.page};
`

const Card = styled.div`
  width: 100%;
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.xl};
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.size.xxl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
`

const Subtitle = styled.p`
  color: ${({ theme }) => theme.color.text.secondary};
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
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.md};
  text-align: left;
  background-color: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.border.strong};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.color.neutral[50]};
  }
`

const AccountName = styled.span`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

const AccountMeta = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  text-transform: capitalize;
`

export function SignInPage() {
  const { signIn } = useSession()
  const navigate = useNavigate()
  const { data: users, loading, error, reload } = useAsyncData(() => listUsers())

  function handleSignIn(user: User) {
    signIn(user)
    navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
  }

  return (
    <Wrapper>
      <Card>
        <div>
          <Title>Amara + Zeann</Title>
          <Subtitle>Store Management System</Subtitle>
        </div>
        <Alert variant="info" title="Mock sign-in">
          Choose a seeded account. Real authentication is not implemented yet.
        </Alert>
        {loading && <LoadingState text="Loading accounts…" />}
        {error && <ErrorState description={error} onRetry={reload} />}
        {!loading && !error && users && users.length === 0 && (
          <EmptyState title="No accounts" description="No seeded accounts are available." />
        )}
        {!loading && !error && users && users.length > 0 && (
          <List>
            {users.map((user) => (
              <li key={user.id}>
                <AccountButton type="button" onClick={() => handleSignIn(user)}>
                  <AccountName>{user.name}</AccountName>
                  <AccountMeta>
                    {user.role}
                    {user.storeId ? ` · ${user.storeId}` : ''}
                  </AccountMeta>
                </AccountButton>
              </li>
            ))}
          </List>
        )}
      </Card>
    </Wrapper>
  )
}
