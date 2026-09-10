import { NavLink } from 'react-router-dom'
import { Dialog } from '@/components/ui/Dialog'
import type { NavItem } from './navItems'
import styled from 'styled-components'
import { NavIcon } from './icons'

interface MoreSheetProps {
  open: boolean
  items: NavItem[]
  onClose: () => void
}

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  list-style: none;
`

const RowLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.primary};
  text-decoration: none;

  &:hover {
    background-color: ${({ theme }) => theme.color.neutral[100]};
  }

  &.active {
    background-color: ${({ theme }) => theme.color.brand[50]};
    color: ${({ theme }) => theme.color.brand[700]};
    font-weight: ${({ theme }) => theme.font.weight.semibold};
  }
`

export function MoreSheet({ open, items, onClose }: MoreSheetProps) {
  return (
    <Dialog open={open} title="More" onClose={onClose}>
      <List>
        {items.map((item) => (
          <li key={item.to}>
            <RowLink to={item.to} onClick={onClose}>
              <NavIcon name={item.icon} />
              {item.label}
            </RowLink>
          </li>
        ))}
      </List>
    </Dialog>
  )
}
