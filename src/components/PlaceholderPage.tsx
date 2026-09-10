import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useHomePath } from '@/features/session/useHomePath'

interface PlaceholderPageProps {
  title: string
  scope: string
  requirements: string
}

export function PlaceholderPage({ title, scope, requirements }: PlaceholderPageProps) {
  const navigate = useNavigate()
  const home = useHomePath()
  return (
    <div>
      <PageHeader title={title} description={scope} />
      <EmptyState
        title="Area foundation ready"
        description={`This area is defined for the confirmed scope (${requirements}). Business workflows arrive in Phase 2; no business data exists yet.`}
        action={
          <Button variant="secondary" onClick={() => navigate(home)}>
            Back to dashboard
          </Button>
        }
      />
    </div>
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()
  const home = useHomePath()
  return (
    <div>
      <PageHeader title="Page not found" description="The page you opened does not exist." />
      <EmptyState
        title="Nothing here"
        description="Use the navigation above or return to the dashboard."
        action={
          <Button variant="secondary" onClick={() => navigate(home)}>
            Back to dashboard
          </Button>
        }
      />
    </div>
  )
}
