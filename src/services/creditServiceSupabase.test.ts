import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCreditHistory, listCreditRecords } from './creditService'

/**
 * Supabase-path regression tests (DEC-067 fix): every test in the repo runs
 * the mock backend, so the Supabase row-mapping shipped with an unread
 * embed — PostgREST returns many-to-one embeds as objects while the generated
 * client types describe them as lists, and the code followed the types. These
 * fixtures use the true runtime (object) shape first, then the typegen (list)
 * shape, so either one resolves.
 */
const supabaseHarness = vi.hoisted(() => ({
  tables: {} as Record<string, unknown[]>,
}))

interface FakeChain {
  select: (...args: unknown[]) => FakeChain
  neq: (...args: unknown[]) => FakeChain
  eq: (...args: unknown[]) => FakeChain
  order: (...args: unknown[]) => Promise<{ data: unknown[]; error: null }>
  maybeSingle: (...args: unknown[]) => Promise<{ data: unknown; error: null }>
  /** postgrest-js builders are thenable: awaiting the chain runs the query. */
  then: (
    onFulfilled: (value: { data: unknown[]; error: null }) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>
}

vi.mock('./supabaseClient', () => {
  function chainFor(table: string): FakeChain {
    const rows = () => supabaseHarness.tables[table] ?? []
    const result = () => ({ data: rows(), error: null })
    const chain: FakeChain = {
      select: () => chain,
      neq: () => chain,
      eq: () => chain,
      order: async () => result(),
      maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
      then: (onFulfilled, onRejected) => Promise.resolve(result()).then(onFulfilled, onRejected),
    }
    return chain
  }
  return {
    isSupabaseConfigured: true,
    supabase: { from: (table: string) => chainFor(table) },
    usernameEmail: (username: string) => `${username}@zafone.local`,
  }
})

function obligationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cred-1',
    customer_id: 'cust-1',
    origin_store_id: 'amara',
    sale_id: 'sale-1',
    terms_id: 'terms-15',
    due_date: '2026-10-15',
    original_amount_minor: 130000,
    balance_minor: 100000,
    status: 'outstanding',
    interest_minor: null,
    created_at: '2026-10-05T00:00:00.000Z',
    ...overrides,
  }
}

/** The true PostgREST runtime shape: many-to-one embeds arrive as objects. */
function objectEmbedSale() {
  return {
    recorded_by_user_id: 'user-3',
    sale_lines: [
      {
        product_id: 'prod-1',
        quantity: 2,
        unit_price_minor: 50000,
        products: { name: 'Rice 25kg' },
      },
      {
        product_id: 'prod-2',
        quantity: 3,
        unit_price_minor: 10000,
        products: { name: 'Sugar 1kg' },
      },
    ],
  }
}

/** The generated-client-types shape: every embed arrives as a list. */
function listEmbedSale() {
  const sale = objectEmbedSale()
  return {
    recorded_by_user_id: sale.recorded_by_user_id,
    sale_lines: sale.sale_lines.map((line) => ({
      ...line,
      products: [{ name: (line.products as { name: string }).name }],
    })),
  }
}

describe('listCreditRecords on the Supabase path', () => {
  beforeEach(() => {
    supabaseHarness.tables = {}
  })

  it('resolves items and the encoder from an object-form embed', async () => {
    supabaseHarness.tables = {
      credit_obligations: [obligationRow({ sales: objectEmbedSale() })],
    }

    const records = await listCreditRecords()

    expect(records).toHaveLength(1)
    expect(records[0]?.recordedByUserId).toBe('user-3')
    expect(records[0]?.items).toEqual([
      { productId: 'prod-1', productName: 'Rice 25kg', quantity: 2, unitPriceMinor: 50000 },
      { productId: 'prod-2', productName: 'Sugar 1kg', quantity: 3, unitPriceMinor: 10000 },
    ])
  })

  it('resolves the same record from a list-form embed', async () => {
    supabaseHarness.tables = {
      credit_obligations: [obligationRow({ sales: [listEmbedSale()] })],
    }

    const records = await listCreditRecords()

    expect(records).toHaveLength(1)
    expect(records[0]?.recordedByUserId).toBe('user-3')
    expect(records[0]?.items.map((item) => item.productName)).toEqual(['Rice 25kg', 'Sugar 1kg'])
  })

  it('keeps a sale-less obligation with no items and no encoder', async () => {
    supabaseHarness.tables = {
      credit_obligations: [obligationRow({ id: 'cred-2', sale_id: null, sales: null })],
    }

    const records = await listCreditRecords()

    expect(records).toHaveLength(1)
    expect(records[0]?.items).toEqual([])
    expect(records[0]?.recordedByUserId).toBeUndefined()
  })

  it('falls back to Unknown item when the product name is missing', async () => {
    const sale = objectEmbedSale()
    supabaseHarness.tables = {
      credit_obligations: [
        obligationRow({
          sales: {
            ...sale,
            sale_lines: [
              { product_id: 'prod-9', quantity: 1, unit_price_minor: 7000, products: null },
            ],
          },
        }),
      ],
    }

    const records = await listCreditRecords()

    expect(records[0]?.items).toEqual([
      { productId: 'prod-9', productName: 'Unknown item', quantity: 1, unitPriceMinor: 7000 },
    ])
  })
})

describe('getCreditHistory on the Supabase path', () => {
  beforeEach(() => {
    supabaseHarness.tables = {}
  })

  it('reads item names from an object-form products embed', async () => {
    supabaseHarness.tables = {
      credit_obligations: [obligationRow()],
      payments: [],
      sale_lines: [
        {
          product_id: 'prod-1',
          quantity: 2,
          unit_price_minor: 50000,
          products: { name: 'Rice 25kg' },
        },
      ],
      sales: [{ sale_date: '2026-09-10' }],
    }

    const history = await getCreditHistory('cred-1')

    expect(history.items).toEqual([
      { productId: 'prod-1', productName: 'Rice 25kg', quantity: 2, unitPriceMinor: 50000 },
    ])
    expect(history.transactionDate).toBe('2026-09-10')
  })
})
