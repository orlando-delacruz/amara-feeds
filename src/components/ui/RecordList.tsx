import styled from 'styled-components'
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { DataTable } from './DataTable'
import type { DataTableColumn, DataTableRow } from './DataTable'
import { Pagination } from './Pagination'
import { useMediaQuery } from '@/features/shared/hooks/useMediaQuery'
import { tokens } from '@/theme/tokens'

/** Every record table shows at most this many rows per page. */
export const RECORD_PAGE_SIZE = 10

interface RecordListProps {
  caption: string
  columns: DataTableColumn[]
  rows: DataTableRow[]
  emptyMessage?: string
  variant?: 'card' | 'grouped'
  renderCard?: (row: DataTableRow, index: number) => ReactNode
  /**
   * When the underlying data set changes (filter, date, store), the caller
   * passes a new key so the page resets to the first one. `renderCard`
   * always receives the row's absolute index in `rows`, not the page offset.
   */
  resetKey?: string | number
}

const Cards = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  list-style: none;
`

const Group = styled.ul`
  display: flex;
  flex-direction: column;
  list-style: none;
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`

const GroupItem = styled.li`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color.border.default};
  }
`

const CardItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: box-shadow ${({ theme }) => theme.motion.base} ease-out;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadow.raised};
  }
`

const CardTitle = styled.span`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  overflow-wrap: break-word;
`

const MetaRow = styled.span`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  font-size: ${({ theme }) => theme.font.size.sm};
`

const MetaLabel = styled.span`
  color: ${({ theme }) => theme.color.text.muted};
`

const MetaValue = styled.span`
  text-align: right;
  overflow-wrap: break-word;
  font-variant-numeric: tabular-nums;
`

function DefaultCard({ row, columns }: { row: DataTableRow; columns: DataTableColumn[] }) {
  const [title, ...rest] = columns
  if (!title) {
    return null
  }
  return (
    <>
      <CardTitle>{row[title.key]}</CardTitle>
      {rest.map((column) => (
        <MetaRow key={column.key}>
          <MetaLabel>{column.header}</MetaLabel>
          <MetaValue>{row[column.key]}</MetaValue>
        </MetaRow>
      ))}
    </>
  )
}

function rowKey(row: DataTableRow, absoluteIndex: number): string | number {
  return row.id && typeof row.id === 'string' ? row.id : absoluteIndex
}

export function RecordList({
  caption,
  columns,
  rows,
  emptyMessage,
  variant = 'card',
  renderCard,
  resetKey,
}: RecordListProps) {
  const wide = useMediaQuery(`(min-width: ${tokens.breakpoint.tablet})`, true)
  const [page, setPage] = useState(0)
  const [prevKey, setPrevKey] = useState(resetKey)
  const topRef = useRef<HTMLDivElement>(null)

  // Reset to the first page when the data set changes. This render-phase
  // adjustment (React's sanctioned derived-state pattern) avoids a
  // setState-in-effect cascade and keeps the page in sync before paint.
  if (prevKey !== resetKey) {
    setPrevKey(resetKey)
    setPage(0)
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / RECORD_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const offset = currentPage * RECORD_PAGE_SIZE
  const pageRows = rows.slice(offset, offset + RECORD_PAGE_SIZE)

  function handlePageChange(next: number) {
    setPage(next)
    topRef.current?.scrollIntoView?.({ block: 'nearest' })
  }

  if (rows.length === 0) {
    return <DataTable caption={caption} columns={columns} rows={rows} emptyMessage={emptyMessage} />
  }

  const pagination =
    pageCount > 1 ? (
      <Pagination
        page={currentPage}
        pageCount={pageCount}
        total={rows.length}
        pageSize={RECORD_PAGE_SIZE}
        label={caption}
        onPageChange={handlePageChange}
      />
    ) : undefined

  if (wide) {
    return (
      <div ref={topRef}>
        <DataTable caption={caption} columns={columns} rows={pageRows} emptyMessage={emptyMessage} />
        {pagination}
      </div>
    )
  }
  if (variant === 'grouped') {
    return (
      <div ref={topRef}>
        <Group aria-label={caption}>
          {pageRows.map((row, index) => {
            const absoluteIndex = offset + index
            return (
              <GroupItem key={rowKey(row, absoluteIndex)}>
                {renderCard ? (
                  renderCard(row, absoluteIndex)
                ) : (
                  <DefaultCard row={row} columns={columns} />
                )}
              </GroupItem>
            )
          })}
        </Group>
        {pagination}
      </div>
    )
  }
  return (
    <div ref={topRef}>
      <Cards aria-label={caption}>
        {pageRows.map((row, index) => {
          const absoluteIndex = offset + index
          return (
            <CardItem key={rowKey(row, absoluteIndex)}>
              {renderCard ? (
                renderCard(row, absoluteIndex)
              ) : (
                <DefaultCard row={row} columns={columns} />
              )}
            </CardItem>
          )
        })}
      </Cards>
      {pagination}
    </div>
  )
}
