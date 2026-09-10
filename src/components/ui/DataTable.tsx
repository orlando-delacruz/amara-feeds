import styled from 'styled-components'
import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'

export interface DataTableColumn {
  key: string
  header: string
}

export type DataTableRow = Record<string, ReactNode>

interface DataTableProps {
  caption: string
  columns: DataTableColumn[]
  rows: DataTableRow[]
  emptyMessage?: string
}

const Scroller = styled.div`
  overflow-x: auto;
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.font.size.sm};
`

const HeadCell = styled.th`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  text-align: left;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  white-space: nowrap;
  border-bottom: 2px solid ${({ theme }) => theme.color.border.strong};
  background-color: ${({ theme }) => theme.color.neutral[50]};
`

const BodyCell = styled.td`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-bottom: 1px solid ${({ theme }) => theme.color.border.default};
  vertical-align: top;
`

const BodyRow = styled.tr`
  &:last-child ${BodyCell} {
    border-bottom: none;
  }
`

const Caption = styled.caption`
  text-align: left;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  background-color: ${({ theme }) => theme.color.surface.card};
`

export function DataTable({ caption, columns, rows, emptyMessage }: DataTableProps) {
  if (rows.length === 0) {
    return <EmptyState title={caption} description={emptyMessage ?? 'No records yet.'} />
  }
  return (
    <Scroller>
      <Table>
        <Caption>{caption}</Caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <HeadCell key={column.key} scope="col">
                {column.header}
              </HeadCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            // Rows render in source order; keys are positional because row
            // identities stay inside services and never cross this seam.
            <BodyRow key={index}>
              {columns.map((column) => (
                <BodyCell key={column.key}>{row[column.key]}</BodyCell>
              ))}
            </BodyRow>
          ))}
        </tbody>
      </Table>
    </Scroller>
  )
}
