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
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme, $store }) => theme.color.store[$store].solid};
  color: ${({ theme }) => theme.color.text.inverse};
  font-family: ${({ theme }) => theme.font.familyCondensed};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: ${({ theme }) => theme.font.tracking.wide};
  text-transform: uppercase;
  white-space: nowrap;
`

const Dot = styled.span<{ $store: StoreId }>`
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.color.white};
  opacity: 0.9;
`

export function StoreBadge({ store }: StoreBadgeProps) {
  return (
    <Badge $store={store} aria-label={`Current store: ${storeNames[store]}`}>
      <Dot $store={store} aria-hidden="true" />
      {storeNames[store]}
    </Badge>
  )
}
