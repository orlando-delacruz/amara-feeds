import { useState } from 'react'
import styled from 'styled-components'
import { updateOwnAccount } from '@/services'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { useAlertMutation } from '@/features/shared'
import { notifySuccess } from '@/lib/swal'
import { useSession } from '@/features/session/useSession'
import { storeLabel } from '@/store/stores'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
  max-width: 480px;
`

const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
`

/**
 * Self-service account page (DEC-049): the signed-in admin changes their own
 * username and password. The current password is always required.
 */
export function MyAccountPage() {
  const { user, signIn } = useSession()
  const [newUsername, setNewUsername] = useState(user?.username ?? '')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const changeUsername = useAlertMutation(
    (input: { username: string; currentPassword: string }) =>
      updateOwnAccount({
        userId: user?.id ?? '',
        currentPassword: input.currentPassword,
        username: input.username,
      }),
    'Could not update the username.',
  )

  const changePassword = useAlertMutation(
    (input: { currentPassword: string; newPassword: string }) =>
      updateOwnAccount({
        userId: user?.id ?? '',
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),
    'Could not update the password.',
  )

  async function handleUsername(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || newUsername.trim() === '' || usernamePassword === '') {
      return
    }
    const result = await changeUsername.run({
      username: newUsername.trim(),
      currentPassword: usernamePassword,
    })
    if (result) {
      setUsernamePassword('')
      signIn({ ...user, username: result.username || newUsername.trim() })
      void notifySuccess('Username updated.', 'Use your new username to sign in next time.')
    }
  }

  async function handlePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || currentPassword === '' || newPassword === '') {
      return
    }
    if (newPassword.length < 4) {
      return
    }
    if (newPassword !== confirmPassword) {
      return
    }
    const result = await changePassword.run({
      currentPassword,
      newPassword,
    })
    if (result) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      void notifySuccess('Password updated.', 'Your current sign-in stays active.')
    }
  }

  return (
    <Stack>
      <PageHeader title="My Account" description="Your sign-in details." size="compact" />
      <Section title="Profile">
        <Hint>
          {[
            user?.name,
            user?.role === 'admin' ? 'Admin' : 'Staff',
            user?.username ? `Signs in as ${user.username}` : undefined,
            user?.storeId ? storeLabel(user.storeId) : 'All stores',
          ]
            .filter(Boolean)
            .join(' · ')}
        </Hint>
      </Section>
      <Section title="Change username">
        <Hint>The new username becomes your sign-in handle.</Hint>
        <Form onSubmit={handleUsername} noValidate>
          <TextField
            id="account-username"
            label="New username"
            value={newUsername}
            onChange={(event) => setNewUsername(event.target.value)}
            autoComplete="username"
            required
          />
          <TextField
            id="account-username-password"
            label="Current password"
            type="password"
            value={usernamePassword}
            onChange={(event) => setUsernamePassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <Button type="submit" disabled={changeUsername.pending}>
            {changeUsername.pending ? 'Saving…' : 'Save username'}
          </Button>
        </Form>
      </Section>
      <Section title="Change password">
        <Hint>At least 4 characters.</Hint>
        <Form onSubmit={handlePassword} noValidate>
          <TextField
            id="account-current-password"
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <TextField
            id="account-new-password"
            label="New password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={4}
            required
          />
          <TextField
            id="account-confirm-password"
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            error={
              confirmPassword !== '' && newPassword !== confirmPassword
                ? 'Passwords do not match.'
                : undefined
            }
            required
          />
          <Button type="submit" disabled={changePassword.pending}>
            {changePassword.pending ? 'Saving…' : 'Save password'}
          </Button>
        </Form>
      </Section>
    </Stack>
  )
}
