import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { FilterBar } from '@/components/ui/FilterBar'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { Icon } from '@/components/ui/icons'
import { todayIso } from '@/lib/dates'
import { exportReportPdf } from '@/lib/exportReportPdf'
import { useSession } from '@/features/session/useSession'
import { useStore } from '@/store/useStore'
import { useBusinessSummaries } from '@/features/dashboard/useBusinessSummaries'
import { SummarySections } from './SummarySections'

export function ReportsPage() {
  const [date, setDate] = useState(todayIso())
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const { user } = useSession()
  const { store } = useStore()
  // Staff see only their assigned store's sales, stock, and received stock;
  // admins see the business-wide summaries.
  const storeId = user?.role === 'staff' ? store : undefined
  const summaries = useBusinessSummaries(date, storeId)

  async function handleExport() {
    if (!summaries.data || exporting) {
      return
    }
    setExportError(null)
    setExporting(true)
    // Let the pending label paint before the (possibly chunk-loaded) save.
    await new Promise((resolve) => setTimeout(resolve, 0))
    try {
      await exportReportPdf({ date, storeId, summaries: summaries.data })
    } catch {
      setExportError('Could not export the report. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Stack>
      <PageHeader
        title="Reports"
        description="Business summaries for the selected date. Export them as a PDF."
        actions={
          <Button onClick={handleExport} disabled={exporting || !summaries.data}>
            <Icon name="download" />
            {exporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        }
        size="compact"
      />
      <FilterBar>
        <DatePicker id="report-date" label="Date" value={date} onChange={setDate} />
      </FilterBar>
      {exportError && <Alert variant="danger">{exportError}</Alert>}
      <SummarySections date={date} storeId={storeId} summaries={summaries} />
    </Stack>
  )
}
