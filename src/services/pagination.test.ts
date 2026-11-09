import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LIST_PAGE_SIZE, collectPages } from './pagination'
import { listAuditEvents } from './auditService'
import { listProducts } from './productService'
import { listSales } from './saleService'

/**
 * Regression tests for the 1,000-row PostgREST cap.
 *
 * Symptom this exists to prevent: the client exported Sept 25 → present and the
 * Sales sheet started at Oct 11. The query was correct and the data was present
 * — the API returned only the newest 1,000 rows and the code never asked for
 * page two, so every older sale vanished with no error.
 *
 * The mock backend returns everything, which is exactly why the whole suite
 * stayed green. These tests drive the Supabase path with a client that really
 * caps its response.
 */
const supabaseHarness = vi.hoisted(() => ({
  sales: [] as unknown[],
  /** Every page request the service made, as [from, to]. */
  requests: [] as Array<[number, number]>,
}))

vi.mock('./supabaseClient', () => {
  function chain() {
    // Default = the PostgREST cap itself, so a caller that never pages gets the
    // same truncated response production gives it. Without this default the
    // fake would return everything and the regression would go unnoticed —
    // which is precisely how the original bug shipped.
    let window: { from: number; to: number } = { from: 0, to: LIST_PAGE_SIZE - 1 }
    const result = () => {
      const rows = supabaseHarness.sales
      const data = rows.slice(window.from, window.to + 1)
      return { data, error: null }
    }
    const api: Record<string, unknown> = {}
    api.select = () => api
    api.eq = () => api
    api.neq = () => api
    api.not = () => api
    api.gte = () => api
    api.lte = () => api
    api.range = (from: number, to: number) => {
      window = { from, to }
      supabaseHarness.requests.push([from, to])
      return api
    }
    // Chainable: real builders return the builder from order(), and the
    // paged lists order twice (value, then id tie-breaker). Awaiting the
    // chain resolves through `then` below.
    api.order = () => api
    api.then = (
      onFulfilled: (value: { data: unknown[]; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(result()).then(onFulfilled, onRejected)
    return api
  }
  return {
    isSupabaseConfigured: true,
    supabase: { from: () => chain() },
    usernameEmail: (username: string) => `${username}@zafone.local`,
  }
})

function saleRow(index: number) {
  const day = String((index % 28) + 1).padStart(2, '0')
  return {
    id: `sale-${index}`,
    store_id: 'amara',
    sale_date: `2026-09-${day}`,
    customer_id: null,
    payment_type: 'cash',
    payment_method: 'Cash',
    delivery_fee_minor: 0,
    delivery_rider_id: null,
    delivery_vehicle_id: null,
    discount_minor: 0,
    total_minor: 1000,
    recorded_by_user_id: 'user-1',
    created_at: `2026-09-${day}T00:00:00.000Z`,
    sale_lines: [],
  }
}

describe('collectPages', () => {
  it('returns everything when the first page is short', async () => {
    const pages = [1, 2, 3]
    const calls: number[] = []
    const rows = await collectPages<number>(
      async (offset) => {
        calls.push(offset)
        return { data: pages.slice(offset), error: null }
      },
      (error) => {
        throw error
      },
    )
    expect(rows).toEqual([1, 2, 3])
    expect(calls).toEqual([0])
  })

  it('keeps requesting disjoint pages until the data runs out', async () => {
    const all = Array.from({ length: LIST_PAGE_SIZE * 2 + 7 }, (_, i) => i)
    const calls: Array<[number, number]> = []
    const rows = await collectPages<number>(
      async (offset, size) => {
        calls.push([offset, size])
        return { data: all.slice(offset, offset + size), error: null }
      },
      (error) => {
        throw error
      },
    )
    expect(rows).toHaveLength(all.length)
    expect(rows).toEqual(all)
    // Disjoint windows: no row fetched twice, none skipped.
    expect(calls).toEqual([
      [0, LIST_PAGE_SIZE],
      [LIST_PAGE_SIZE, LIST_PAGE_SIZE],
      [LIST_PAGE_SIZE * 2, LIST_PAGE_SIZE],
    ])
  })

  it('stops cleanly when the total is an exact multiple of the page size', async () => {
    const all = Array.from({ length: LIST_PAGE_SIZE }, (_, i) => i)
    let calls = 0
    const rows = await collectPages<number>(
      async (offset, size) => {
        calls += 1
        return { data: all.slice(offset, offset + size), error: null }
      },
      (error) => {
        throw error
      },
    )
    expect(rows).toHaveLength(LIST_PAGE_SIZE)
    expect(calls).toBe(2) // full page, then the empty page that ends it
  })

  it('surfaces the first error instead of returning partial data', async () => {
    await expect(
      collectPages<number>(
        async (offset) =>
          offset === 0
            ? // A FULL page, so the loop actually reaches the failing request.
              { data: Array.from({ length: LIST_PAGE_SIZE }, (_, i) => i), error: null }
            : { data: null, error: new Error('boom') },
        (error) => {
          throw error
        },
      ),
    ).rejects.toThrow('boom')
  })
})

describe('listSales pagination (the report-export regression)', () => {
  beforeEach(() => {
    supabaseHarness.requests = []
    // 2,400 sales: comfortably past the 1,000-row cap that truncated the export.
    supabaseHarness.sales = Array.from({ length: 2400 }, (_, i) => saleRow(i))
  })

  it('returns every sale in the range, not just the first page', async () => {
    const sales = await listSales({ from: '2026-09-01', to: '2026-09-30' })
    expect(sales).toHaveLength(2400)
    expect(new Set(sales.map((sale) => sale.id)).size).toBe(2400)
  })

  it('requests consecutive, non-overlapping pages', async () => {
    await listSales({ from: '2026-09-01', to: '2026-09-30' })
    expect(supabaseHarness.requests).toEqual([
      [0, LIST_PAGE_SIZE - 1],
      [LIST_PAGE_SIZE, LIST_PAGE_SIZE * 2 - 1],
      [LIST_PAGE_SIZE * 2, LIST_PAGE_SIZE * 3 - 1],
    ])
  })

  it('stops after one request when the range holds less than a page', async () => {
    supabaseHarness.sales = supabaseHarness.sales.slice(0, 40)
    const sales = await listSales({ from: '2026-09-01', to: '2026-09-30' })
    expect(sales).toHaveLength(40)
    expect(supabaseHarness.requests).toEqual([[0, LIST_PAGE_SIZE - 1]])
  })
})

function productRow(index: number) {
  const suffix = String(index).padStart(4, '0')
  return {
    id: `prod-${suffix}`,
    name: `Product ${suffix}`,
    status: 'active',
    created_by_user_id: null,
    created_at: '2026-09-01T00:00:00.000Z',
  }
}

describe('listProducts pagination', () => {
  beforeEach(() => {
    supabaseHarness.requests = []
    supabaseHarness.sales = Array.from({ length: 2300 }, (_, i) => productRow(i))
  })

  it('returns every product, not just the first page', async () => {
    const products = await listProducts()
    expect(products).toHaveLength(2300)
    expect(new Set(products.map((product) => product.id)).size).toBe(2300)
  })

  it('requests consecutive, non-overlapping pages', async () => {
    await listProducts()
    expect(supabaseHarness.requests).toEqual([
      [0, LIST_PAGE_SIZE - 1],
      [LIST_PAGE_SIZE, LIST_PAGE_SIZE * 2 - 1],
      [LIST_PAGE_SIZE * 2, LIST_PAGE_SIZE * 3 - 1],
    ])
  })
})

function auditRow(index: number) {
  return {
    id: `audit-${index}`,
    action: 'sale.recorded',
    actor_user_id: 'user-1',
    actor_role: 'staff',
    store_id: 'amara',
    related_user_id: null,
    subject: 'Sale at Amara',
    detail: null,
    created_at: '2026-09-01T00:00:00.000Z',
  }
}

describe('listAuditEvents pagination', () => {
  beforeEach(() => {
    supabaseHarness.requests = []
    supabaseHarness.sales = Array.from({ length: 2050 }, (_, i) => auditRow(i))
  })

  it('returns every audit event, not just the first page', async () => {
    const events = await listAuditEvents()
    expect(events).toHaveLength(2050)
    expect(new Set(events.map((event) => event.id)).size).toBe(2050)
  })

  it('requests consecutive, non-overlapping pages', async () => {
    await listAuditEvents()
    expect(supabaseHarness.requests).toEqual([
      [0, LIST_PAGE_SIZE - 1],
      [LIST_PAGE_SIZE, LIST_PAGE_SIZE * 2 - 1],
      [LIST_PAGE_SIZE * 2, LIST_PAGE_SIZE * 3 - 1],
    ])
  })
})
