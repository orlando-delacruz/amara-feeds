import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportReceivingExcel, receivingExcelFilename } from './exportReceivingExcel'

describe('receivingExcelFilename', () => {
  it('names the file by store (DEC-060)', () => {
    expect(receivingExcelFilename('amara')).toBe('zaf-one-inventory-Amara.xlsx')
    expect(receivingExcelFilename('zeann')).toBe('zaf-one-inventory-Zeann.xlsx')
  })
})

describe('exportReceivingExcel', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('downloads the inventory workbook without throwing (DEC-060)', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await exportReceivingExcel({
      storeId: 'amara',
      rows: [
        {
          date: '2026-03-04',
          storeId: 'amara',
          productName: 'Rice 25kg',
          quantity: 20,
          supplier: 'Central Supply',
          costPriceMinor: 110000,
          sellingPriceMinor: 115000,
          recordedByName: 'Alice',
        },
      ],
    })
    expect(click).toHaveBeenCalled()
    click.mockRestore()
  })
})
