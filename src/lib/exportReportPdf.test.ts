// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/services/mocks/db'
import {
  getCurrentStock,
  getDailySalesByStore,
  getOutstandingCreditTotal,
  getOverallDailySales,
  getPaymentsSummary,
  getReceivedStock,
} from '@/services'
import { buildReportPdf, reportPdfFilename } from './exportReportPdf'
import { todayIso } from '@/lib/dates'
import type { BusinessSummaries } from '@/features/dashboard/useBusinessSummaries'
import type { StoreId } from '@/domain'

interface WithAutoTable {
  lastAutoTable?: { finalY: number }
}

async function makeSummaries(storeId?: StoreId): Promise<BusinessSummaries> {
  const date = todayIso()
  const [perStore, , outstanding, payments, stock, received] = await Promise.all([
    getDailySalesByStore(date),
    getOverallDailySales(date),
    getOutstandingCreditTotal(),
    getPaymentsSummary({ date }),
    getCurrentStock(),
    getReceivedStock({ date }),
  ])
  const scoped = storeId ? perStore.filter((row) => row.storeId === storeId) : perStore
  const first = scoped[0]
  return {
    perStore: scoped,
    overall: {
      date,
      totalMinor: first?.totalMinor ?? 0,
      saleCount: first?.saleCount ?? 0,
    },
    outstanding,
    payments,
    stock: storeId ? stock.filter((row) => row.storeId === storeId) : stock,
    received: storeId ? received.filter((row) => row.storeId === storeId) : received,
    weekly: {
      perStore: [],
      overall: { startDate: '', endDate: '', totalMinor: 0, saleCount: 0 },
    },
    monthly: {
      perStore: [],
      overall: { startDate: '', endDate: '', totalMinor: 0, saleCount: 0 },
    },
  }
}

describe('exportReportPdf', () => {
  beforeEach(() => resetDb())

  it('builds an A4 PDF with all report tables for the business-wide report', async () => {
    const doc = await buildReportPdf({ date: todayIso(), summaries: await makeSummaries() })
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
    const drawn = (doc as unknown as WithAutoTable).lastAutoTable
    expect(drawn?.finalY ?? 0).toBeGreaterThan(0)
  })

  it('builds a scoped PDF for a staff store', async () => {
    const doc = await buildReportPdf({
      date: todayIso(),
      storeId: 'amara',
      summaries: await makeSummaries('amara'),
    })
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
    const drawn = (doc as unknown as WithAutoTable).lastAutoTable
    expect(drawn?.finalY ?? 0).toBeGreaterThan(0)
  })

  it('builds a valid PDF when every section is empty', async () => {
    const doc = await buildReportPdf({
      date: '2000-01-01',
      summaries: {
        perStore: [],
        overall: { date: '2000-01-01', totalMinor: 0, saleCount: 0 },
        outstanding: { totalMinor: 0, count: 0 },
        payments: { totalMinor: 0, count: 0 },
        stock: [],
        received: [],
        weekly: {
          perStore: [],
          overall: { startDate: '', endDate: '', totalMinor: 0, saleCount: 0 },
        },
        monthly: {
          perStore: [],
          overall: { startDate: '', endDate: '', totalMinor: 0, saleCount: 0 },
        },
      },
    })
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
  })

  it('names the PDF with the date and scope', () => {
    expect(reportPdfFilename('2026-09-14')).toBe('amara-feeds-report-2026-09-14-both-stores.pdf')
    expect(reportPdfFilename('2026-09-14', 'amara')).toBe('amara-feeds-report-2026-09-14-Amara.pdf')
  })
})
