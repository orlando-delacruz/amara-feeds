import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { todayIso } from '@/lib/dates'
import { SummarySections } from './SummarySections'

export function ReportsPage() {
  const [date, setDate] = useState(todayIso())

  return (
    <Stack>
      <PageHeader
        title="Reports"
        description="Agreed business summaries. Excel export formats remain under confirmation; printing is available."
        actions={<Button onClick={() => window.print()}>Print</Button>}
      />
      <TextField
        id="report-date"
        label="Date"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />
      <SummarySections date={date} />
    </Stack>
  )
}
