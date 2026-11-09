/**
 * PostgREST returns at most a fixed number of rows per request (1,000 on hosted
 * Supabase). A list query that asks for everything and trusts the response
 * silently drops everything past that cap — with `order(... desc)` it keeps the
 * NEWEST rows and loses the oldest.
 *
 * That is exactly how the report export lost every sale before 2026-10-11: the
 * Sales sheet asked for Sept 25 → present, the API returned the newest 1,000
 * rows, and the file simply started in October with no error. The dashboard had
 * already been paged (DEC-065); the lists feeding the export had not.
 *
 * Rule: every `list*` function that reads a table which can grow must page.
 */

/** Matches the PostgREST default; ranges are disjoint so nothing repeats. */
export const LIST_PAGE_SIZE = 1000

/**
 * Fetches every row a query would return, one disjoint page at a time.
 *
 * - `fetchPage(offset, size)` must build a FRESH query each call — Supabase
 *   builders are mutated by their transform methods, so reusing one would
 *   re-apply `range` to the same object.
 * - Pages are `range(offset, offset + size - 1)`, so consecutive pages never
 *   share a row: no record is counted twice or skipped.
 * - A short page proves the end; an exactly-full final page is followed by one
 *   empty page, which terminates cleanly.
 */
export async function collectPages<T>(
  fetchPage: (offset: number, size: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  throwOnError: (error: unknown) => never,
): Promise<T[]> {
  const rows: T[] = []
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, error } = await fetchPage(offset, LIST_PAGE_SIZE)
    if (error) {
      throwOnError(error)
    }
    const page = data ?? []
    rows.push(...page)
    if (page.length < LIST_PAGE_SIZE) {
      return rows
    }
  }
}
