import styled from 'styled-components'
import { storeNames } from '@/store/stores'
import type { StoreId } from '@/store/stores'

interface StoreBadgeProps {
  store: StoreId
}

const Badge = styled.span<{ $store: StoreId }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme, $store }) => theme.color.store[$store].border};
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme, $store }) => theme.color.store[$store].background};
  color: ${({ theme, $store }) => theme.color.store[$store].text};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  white-space: nowrap;
`

const Dot = styled.span<{ $store: StoreId }>`
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme, $store }) => theme.color.store[$store].solid};
`

export function StoreBadge({ store }: StoreBadgeProps) {
  return (
    <Badge $store={store} aria-label={`Current store: ${storeNames[store]}`}>
      <Dot $store={store} aria-hidden="true" />
      {storeNames[store]}
    </Badge>
  )
}
