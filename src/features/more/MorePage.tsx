import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ListRow } from '@/components/ui/ListRow'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { navItemsForRole } from '@/components/navigation/navItems'
import { NavIcon } from '@/components/navigation/icons'
import { useSession } from '@/features/session/useSession'

const Group = styled.ul`
  display: flex;
  flex-direction: column;
  list-style: none;
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`

const GroupItem = styled.li`
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.md};

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color.border.default};
  }
`

export function MorePage() {
  const { user, signOut } = useSession()
  const navigate = useNavigate()
  const overflow = navItemsForRole(user?.role ?? 'staff').filter((item) => !item.primary)

  function handleSignOut() {
    signOut()
    navigate('/sign-in', { replace: true })
  }

  return (
    <Stack>
      <PageHeader title="More" description="All destinations in one place." size="compact" />
      <nav aria-label="More destinations">
        <Group>
          {overflow.map((item) => (
            <GroupItem key={item.to}>
              <ListRow
                leading={<NavIcon name={item.icon} />}
                title={item.label}
                subtitle={item.description}
                href={item.to}
              />
            </GroupItem>
          ))}
        </Group>
      </nav>
      <Button variant="secondary" fullWidth type="button" onClick={handleSignOut}>
        Sign out
      </Button>
    </Stack>
  )
}
