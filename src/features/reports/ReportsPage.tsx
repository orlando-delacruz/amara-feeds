import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { FilterBar } from '@/components/ui/FilterBar'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { Icon } from '@/components/ui/icons'
import { todayIso } from '@/lib/dates'
import { useSession } from '@/features/session/useSession'
import { useStore } from '@/store/useStore'
import { SummarySections } from './SummarySections'

export function ReportsPage() {
  const [date, setDate] = useState(todayIso())
  const { user } = useSession()
  const { store } = useStore()
  // Staff see only their assigned store's sales, stock, and received stock;
  // admins see the business-wide summaries.
  const storeId = user?.role === 'staff' ? store : undefined

  return (
    <Stack>
      <PageHeader
        title="Reports"
        description="Business summaries for the selected date. Print from this page."
        actions={
          <Button onClick={() => window.print()}>
            <Icon name="print" />
            Print
          </Button>
        }
        size="compact"
      />
      <FilterBar>
        <TextField
          id="report-date"
          label="Date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </FilterBar>
      <SummarySections date={date} storeId={storeId} />
    </Stack>
  )
}
