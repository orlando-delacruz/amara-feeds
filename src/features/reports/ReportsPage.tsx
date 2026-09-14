import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { FilterBar } from '@/components/ui/FilterBar'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { Icon } from '@/components/ui/icons'
import { todayIso } from '@/lib/dates'
import { exportReportExcel } from '@/lib/exportReportExcel'
import { buildSalesReportRows } from './reportRows'
import { SummarySections } from './SummarySections'
import { useReportSummaries } from './useReportSummaries'

export function ReportsPage() {
  const today = todayIso()
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const summaries = useReportSummaries(from, to)

  function handleFromChange(next: string) {
    setFrom(next)
    if (next > to) {
      setTo(next)
    }
  }

  function handleToChange(next: string) {
    setTo(next)
    if (next < from) {
      setFrom(next)
    }
  }

  async function handleExport() {
    if (!summaries.data || exporting) {
      return
    }
    setExportError(null)
    setExporting(true)
    await new Promise((resolve) => setTimeout(resolve, 0))
    try {
      const rows = await buildSalesReportRows(from, to)
      await exportReportExcel({ from, to, rows })
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
        description="Business summaries for the selected date range. Export them as an Excel file."
        actions={
          <Button onClick={handleExport} disabled={exporting || !summaries.data}>
            <Icon name="download" />
            {exporting ? 'Exporting…' : 'Export Excel'}
          </Button>
        }
        size="compact"
      />
      <FilterBar>
        <DatePicker
          id="report-from"
          label="From"
          value={from}
          onChange={handleFromChange}
          max={to}
        />
        <DatePicker id="report-to" label="To" value={to} onChange={handleToChange} min={from} />
      </FilterBar>
      {exportError && <Alert variant="danger">{exportError}</Alert>}
      <SummarySections from={from} to={to} summaries={summaries} />
    </Stack>
  )
}
