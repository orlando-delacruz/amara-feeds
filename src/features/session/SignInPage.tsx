import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import logo from '@/assets/logo-clear.png'
import { signIn } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useMutation } from '@/features/shared'
import { useSession } from './useSession'
import type { User } from '@/domain'

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
    border-radius: ${({ theme }) => theme.radius.xl};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    grid-template-columns: 5fr 6fr;
  }
`

const BrandPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.xl};
  background-color: ${({ theme }) => theme.color.brand[600]};
  color: ${({ theme }) => theme.color.text.inverse};
  box-shadow: inset 0 -3px 0 rgba(255, 255, 255, 0.14);

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    padding: ${({ theme }) => theme.space.xxxl};
  }
`

const Title = styled.h1`
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.xxl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  text-wrap: balance;

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    font-size: 32px;
  }
`

const Subtitle = styled.p`
  color: ${({ theme }) => theme.color.brand.tint};
  font-size: ${({ theme }) => theme.font.size.md};
`

const BrandMark = styled.span`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.space.md};
`

const LogoImg = styled.img`
  width: 144px;
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
`

const StoreStrip = styled.div`
  display: flex;
  height: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.sm};
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.full};
  opacity: 0.7;
`

const StoreStripHalf = styled.span<{ $store: 'amara' | 'zeann' }>`
  flex: 1;
  background-color: ${({ theme, $store }) => theme.color.store[$store].solid};
`

const StoreCaption = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.brand.tint};
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
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  text-wrap: balance;
`

const AccountMeta = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`

export function SignInPage() {
  const { signIn: setSession } = useSession()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const login = useMutation(signIn)

  function handleSignedIn(user: User) {
    setSession(user)
    navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const user = await login.run({ username, password })
    if (user) {
      handleSignedIn(user)
    }
  }

  return (
    <Page>
      <Shell>
        <BrandPanel>
          <div>
            <BrandMark aria-hidden="true">
              <LogoImg src={logo} alt="" />
            </BrandMark>
            <Title>ZAF ONE</Title>
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
          <SectionTitle>Sign in</SectionTitle>
          <AccountMeta>Use your staff account to continue.</AccountMeta>
          <Form onSubmit={handleSubmit} noValidate>
            {login.error && <Alert variant="danger">{login.error}</Alert>}
            <TextField
              id="sign-in-username"
              label="Username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
            <TextField
              id="sign-in-password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button type="submit" disabled={login.pending}>
              {login.pending ? 'Signing in…' : 'Sign in'}
            </Button>
          </Form>
        </AccountPanel>
      </Shell>
    </Page>
  )
}
