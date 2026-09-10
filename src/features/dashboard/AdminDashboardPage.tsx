import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { SummarySections } from '@/features/reports/SummarySections'
import { todayIso } from '@/lib/dates'

export function AdminDashboardPage() {
  return (
    <Stack>
      <PageHeader
        title="Admin Dashboard"
        description="Business-wide summaries across both stores."
      />
      <SummarySections date={todayIso()} />
    </Stack>
  )
}
