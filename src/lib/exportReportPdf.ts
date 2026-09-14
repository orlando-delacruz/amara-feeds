import { formatDate, formatDateTime } from './format'
import { storeNames } from '@/store/stores'
import { tokens } from '@/theme/tokens'
import type { BusinessSummaries } from '@/features/dashboard/useBusinessSummaries'
import type { StoreId } from '@/domain'

export interface ReportPdfInput {
  date: string
  /** When given, the report is scoped to one store (staff surface). */
  storeId?: StoreId
  summaries: BusinessSummaries
}

type Doc = import('jspdf').jsPDF

const PAGE_WIDTH = 210 // A4 portrait, mm
const PAGE_HEIGHT = 297
const MARGIN = 14
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const FOOTER_HEIGHT = 12

const BRAND = tokens.color.brand[600] // #1d3a2f
const BRAND_DARK = tokens.color.brand[700] // #152b22
const CREAM = tokens.color.cream // #f7f2e6
const CREAM_SOFT = tokens.color.brand[100] // #dbe3da
const PAGE_GROUND = tokens.color.surface.page // #f4f0e6
const CARD = tokens.color.surface.card // #fbf8f0
const BORDER = tokens.color.border.default // #ddd5c4
const MUTED = tokens.color.text.muted // #6f6755
const AMARA = tokens.color.store.amara
const ZEANN = tokens.color.store.zeann

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

function rgb(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  return [r, g, b]
}

// The peso sign (U+20B1) is not in jsPDF's built-in font encodings, so money
// uses the ASCII "PHP" currency code instead of the ₱ glyph.
function money(minor: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
  }).format(minor / 100)
}

/**
 * Builds a data-driven A4 report PDF from the same summaries the page shows.
 * The layout mirrors the app's painted delivery-vehicle signage (DEC-019):
 * a depot-enamel header band, store hero plates, tinted stat cards and
 * warm-zebra tables. Text stays vector and the layout is identical regardless
 * of viewport. jsPDF is imported lazily so the library only ships on export.
 */
export async function buildReportPdf({ date, storeId, summaries }: ReportPdfInput): Promise<Doc> {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageCountRef = { value: 1 }
  let cursorY = 0

  const ensureSpace = (height: number) => {
    if (cursorY + height > PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT) {
      doc.addPage()
      pageCountRef.value += 1
      cursorY = MARGIN
    }
  }

  const sectionHeader = (label: string) => {
    ensureSpace(14)
    const chipW = label.length * 3.1 + 10
    doc.setFillColor(...rgb(BRAND))
    doc.roundedRect(MARGIN, cursorY, chipW, 8, 1.6, 1.6, 'F')
    doc.setFillColor(...rgb(BRAND_DARK))
    doc.rect(MARGIN, cursorY + 8 - 1.2, chipW, 1.2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.text(label.toUpperCase(), MARGIN + 5, cursorY + 5.5)
    doc.setDrawColor(...rgb(BORDER))
    doc.setLineWidth(0.4)
    doc.line(MARGIN + chipW + 4, cursorY + 4, PAGE_WIDTH - MARGIN, cursorY + 4)
    cursorY += 14
  }

  const figureCard = (opts: {
    x: number
    y: number
    width: number
    height: number
    fill: string
    textColor: string
    label: string
    value: string
    caption?: string
  }) => {
    const { x, y, width, height, fill, textColor, label, value, caption } = opts
    doc.setFillColor(...rgb(fill))
    doc.setDrawColor(...rgb(BRAND_DARK))
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, width, height, 2, 2, 'FD')
    doc.setTextColor(...rgb(textColor))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(label.toUpperCase(), x + 5, y + 6.5)
    doc.setFontSize(value.length > 12 ? 12 : 15)
    doc.text(value, x + 5, y + height - 7)
    if (caption) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...rgb(textColor))
      doc.text(caption, x + 5, y + height - 2.5)
    }
  }

  const storeCard = (store: StoreId, totalMinor: number, saleCount: number, x: number) => {
    const storeColors = store === 'amara' ? AMARA : ZEANN
    figureCard({
      x,
      y: cursorY,
      width: 60,
      height: 22,
      fill: storeColors.solid,
      textColor: CREAM,
      label: storeNames[store],
      value: money(totalMinor),
      caption: `${saleCount} sales`,
    })
  }

  // ---- Header band ----
  doc.setFillColor(...rgb(BRAND))
  doc.rect(0, 0, PAGE_WIDTH, 30, 'F')
  doc.setFillColor(...rgb(BRAND_DARK))
  doc.rect(0, 30, PAGE_WIDTH, 1.2, 'F')

  doc.setTextColor(...rgb(CREAM))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('AMARA FEEDS', MARGIN, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...rgb(CREAM_SOFT))
  doc.text('Business Report', MARGIN, 21)

  const dateChip = formatDate(date).toUpperCase()
  const chipW = dateChip.length * 2.4 + 8
  doc.setFillColor(...rgb(BRAND_DARK))
  doc.roundedRect(PAGE_WIDTH - MARGIN - chipW, 9, chipW, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...rgb(CREAM))
  doc.text(dateChip, PAGE_WIDTH - MARGIN - 4, 16.5, { align: 'right' })

  cursorY = 36

  // ---- Meta strip ----
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...rgb(MUTED))
  doc.text(
    `Store: ${storeId ? storeNames[storeId] : 'Both stores'}   ·   Generated: ${formatDateTime(new Date().toISOString())}`,
    MARGIN,
    cursorY,
  )
  cursorY += 8

  // ---- Daily sales hero cards ----
  ensureSpace(34)
  const cardGap = 4
  const overallWidth = 62
  const storeCardWidth = 56
  const storeStartX = MARGIN + overallWidth + cardGap
  const overall = summaries.overall

  figureCard({
    x: MARGIN,
    y: cursorY,
    width: overallWidth,
    height: 24,
    fill: BRAND,
    textColor: CREAM,
    label: 'Overall daily sales',
    value: money(overall.totalMinor),
    caption: `${overall.saleCount} sales`,
  })

  if (storeId) {
    storeCard(storeId, overall.totalMinor, overall.saleCount, storeStartX)
  } else {
    const amara = summaries.perStore.find((row) => row.storeId === 'amara')
    const zeann = summaries.perStore.find((row) => row.storeId === 'zeann')
    storeCard('amara', amara?.totalMinor ?? 0, amara?.saleCount ?? 0, storeStartX)
    storeCard(
      'zeann',
      zeann?.totalMinor ?? 0,
      zeann?.saleCount ?? 0,
      storeStartX + storeCardWidth + cardGap,
    )
  }
  cursorY += 24 + 10

  // ---- Daily sales breakdown ----
  sectionHeader('Daily sales by store')
  const perStore = summaries.perStore
  if (perStore.length === 0) {
    drawEmptyState(doc, 'No sales recorded for this period.', cursorY)
    cursorY += 14
  } else {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Store', 'Sales', 'Total']],
      body: perStore.map((row) => [
        {
          content: storeNames[row.storeId],
          styles: { fontStyle: 'bold', ...storeCellStyles(row.storeId) },
        },
        { content: String(row.saleCount), styles: { halign: 'center' } },
        { content: money(row.totalMinor), styles: { halign: 'right' } },
      ]),
      foot: [
        [
          { content: 'Total', styles: { fontStyle: 'bold', halign: 'left' } },
          {
            content: String(overall.saleCount),
            styles: { fontStyle: 'bold', halign: 'center' },
          },
          {
            content: money(overall.totalMinor),
            styles: { fontStyle: 'bold', halign: 'right' },
          },
        ],
      ],
      theme: 'grid',
      styles: {
        fontSize: 9,
        textColor: rgb(tokens.color.text.primary),
        lineColor: rgb(BORDER),
        lineWidth: 0.2,
        cellPadding: 3,
      },
      headStyles: { fillColor: rgb(BRAND), textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: rgb(PAGE_GROUND), textColor: rgb(BRAND_DARK) },
      alternateRowStyles: { fillColor: rgb(tokens.color.neutral[50]) },
    })
    cursorY = autoTableFinalY(doc, cursorY) + 8
  }

  // ---- Summary figure cards ----
  const outstanding = summaries.outstanding
  const payments = summaries.payments
  const summaryCardWidth = (CONTENT_WIDTH - cardGap) / 2
  figureCard({
    x: MARGIN,
    y: cursorY,
    width: summaryCardWidth,
    height: 22,
    fill: tokens.color.status.warning.background,
    textColor: tokens.color.status.warning.text,
    label: 'Outstanding credit',
    value: money(outstanding.totalMinor),
    caption: `${outstanding.count} obligations`,
  })
  figureCard({
    x: MARGIN + summaryCardWidth + cardGap,
    y: cursorY,
    width: summaryCardWidth,
    height: 22,
    fill: tokens.color.status.success.background,
    textColor: tokens.color.status.success.text,
    label: 'Payments',
    value: money(payments.totalMinor),
    caption: `${payments.count} payments`,
  })
  cursorY += 22 + 10

  // ---- Current stock ----
  const stockWide = !storeId
  sectionHeader('Current stock')
  if (summaries.stock.length === 0) {
    drawEmptyState(doc, 'No stock on hand for this store.', cursorY)
    cursorY += 14
  } else {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: stockWide ? [['Store', 'Product', 'Quantity']] : [['Product', 'Quantity']],
      body: summaries.stock.map((row) =>
        stockWide
          ? [
              {
                content: storeNames[row.storeId],
                styles: {
                  fontStyle: 'bold',
                  ...storeCellStyles(row.storeId),
                },
              },
              row.productName,
              { content: String(row.quantity), styles: { halign: 'center' } },
            ]
          : [row.productName, { content: String(row.quantity), styles: { halign: 'center' } }],
      ),
      theme: 'grid',
      styles: {
        fontSize: 9,
        textColor: rgb(tokens.color.text.primary),
        lineColor: rgb(BORDER),
        lineWidth: 0.2,
        cellPadding: 3,
      },
      headStyles: { fillColor: rgb(BRAND), textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: rgb(tokens.color.neutral[50]) },
    })
    cursorY = autoTableFinalY(doc, cursorY) + 8
  }

  // ---- Received stock ----
  const receivedWide = !storeId
  sectionHeader('Received stock')
  if (summaries.received.length === 0) {
    drawEmptyState(doc, 'No stock received for this period.', cursorY)
    cursorY += 14
  } else {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: receivedWide
        ? [['Store', 'Product', 'Quantity', 'Cost price']]
        : [['Product', 'Quantity', 'Cost price']],
      body: summaries.received.map((row) =>
        receivedWide
          ? [
              {
                content: storeNames[row.storeId],
                styles: {
                  fontStyle: 'bold',
                  ...storeCellStyles(row.storeId),
                },
              },
              row.productName,
              { content: String(row.quantity), styles: { halign: 'center' } },
              { content: money(row.costPriceMinor), styles: { halign: 'right' } },
            ]
          : [
              row.productName,
              { content: String(row.quantity), styles: { halign: 'center' } },
              { content: money(row.costPriceMinor), styles: { halign: 'right' } },
            ],
      ),
      theme: 'grid',
      styles: {
        fontSize: 9,
        textColor: rgb(tokens.color.text.primary),
        lineColor: rgb(BORDER),
        lineWidth: 0.2,
        cellPadding: 3,
      },
      headStyles: { fillColor: rgb(BRAND), textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: rgb(tokens.color.neutral[50]) },
    })
    cursorY = autoTableFinalY(doc, cursorY) + 8
  }

  addFooters(doc, date)
  return doc
}

function storeCellStyles(store: StoreId) {
  const colors = store === 'amara' ? AMARA : ZEANN
  return {
    fillColor: rgb(colors.background),
    textColor: rgb(colors.text),
  }
}

function drawEmptyState(doc: Doc, message: string, y: number) {
  doc.setFillColor(...rgb(CARD))
  doc.setDrawColor(...rgb(BORDER))
  doc.setLineWidth(0.2)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 12, 2, 2, 'FD')
  doc.setTextColor(...rgb(MUTED))
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.text(message, PAGE_WIDTH / 2, y + 7.5, { align: 'center' })
}

function autoTableFinalY(doc: Doc, fallback: number): number {
  const table = (doc as Doc & { lastAutoTable?: { finalY: number } }).lastAutoTable
  return table?.finalY ?? fallback
}

function addFooters(doc: Doc, date: string) {
  const count = doc.getNumberOfPages()
  const footerText = `Amara Feeds · Business Report · ${formatDate(date)}`
  for (let page = 1; page <= count; page += 1) {
    doc.setPage(page)
    const y = PAGE_HEIGHT - MARGIN
    doc.setDrawColor(...rgb(BORDER))
    doc.setLineWidth(0.3)
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...rgb(MUTED))
    doc.text(footerText, MARGIN, y + 5)
    doc.text(`Page ${page} of ${count}`, PAGE_WIDTH - MARGIN, y + 5, { align: 'right' })
  }
}

export function reportPdfFilename(date: string, storeId?: StoreId): string {
  const scope = storeId ? storeNames[storeId] : 'both-stores'
  return `amara-feeds-report-${date}-${scope}.pdf`
}

/** Builds and downloads the report PDF for the given date and scope. */
export async function exportReportPdf(input: ReportPdfInput): Promise<void> {
  const doc = await buildReportPdf(input)
  doc.save(reportPdfFilename(input.date, input.storeId))
}
