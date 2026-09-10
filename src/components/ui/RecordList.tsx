import styled from 'styled-components'
import type { ReactNode } from 'react'
import { DataTable } from './DataTable'
import type { DataTableColumn, DataTableRow } from './DataTable'
import { useMediaQuery } from '@/features/shared/hooks/useMediaQuery'
import { tokens } from '@/theme/tokens'

interface RecordListProps {
  caption: string
  columns: DataTableColumn[]
  rows: DataTableRow[]
  emptyMessage?: string
  renderCard?: (row: DataTableRow, index: number) => ReactNode
}

const Cards = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  list-style: none;
`

const CardItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  background-color: ${({ theme }) => theme.color.surface.card};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
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
  color: ${({ theme }) => theme.color.text.secondary};
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

export function RecordList({ caption, columns, rows, emptyMessage, renderCard }: RecordListProps) {
  const wide = useMediaQuery(`(min-width: ${tokens.breakpoint.tablet})`, true)
  if (wide) {
    return <DataTable caption={caption} columns={columns} rows={rows} emptyMessage={emptyMessage} />
  }
  if (rows.length === 0) {
    return <DataTable caption={caption} columns={columns} rows={rows} emptyMessage={emptyMessage} />
  }
  return (
    <Cards aria-label={caption}>
      {rows.map((row, index) => (
        <CardItem key={row.id && typeof row.id === 'string' ? row.id : index}>
          {renderCard ? renderCard(row, index) : <DefaultCard row={row} columns={columns} />}
        </CardItem>
      ))}
    </Cards>
  )
}
