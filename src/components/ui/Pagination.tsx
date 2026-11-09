import styled from 'styled-components'
import { Button } from './Button'

interface PaginationProps {
  /** Zero-based current page. */
  page: number
  pageCount: number
  total: number
  pageSize: number
  /** Table caption, used for the nav accessible name. */
  label: string
  onPageChange: (next: number) => void
}

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  padding-top: ${({ theme }) => theme.space.md};
`

const Status = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  font-variant-numeric: tabular-nums;
`

const Controls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
`

export function Pagination({ page, pageCount, total, pageSize, label, onPageChange }: PaginationProps) {
  if (pageCount <= 1) {
    return null
  }
  const start = page * pageSize + 1
  const end = Math.min((page + 1) * pageSize, total)
  return (
    <Nav aria-label={`${label} pagination`}>
      <Status aria-live="polite">
        Showing {start}–{end} of {total}
      </Status>
      <Controls>
        <Button
          size="sm"
          variant="secondary"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </Controls>
    </Nav>
  )
}
