import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { StoreBadge } from '@/components/ui/StoreBadge'
import { storeIds, storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { StoreId } from '@/store/stores'

interface TopBarProps {
  sectionLabel: string
  switchTo: string
  switchLabel: string
}

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  grid-column: 1 / -1;
  background-color: ${({ theme }) => theme.color.surface.card};
  border-bottom: 1px solid ${({ theme }) => theme.color.border.default};
`

const Inner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  max-width: 72rem;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
`

const Brand = styled(Link)`
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.color.text.primary};
  text-decoration: none;
  white-space: nowrap;
`

const SectionTag = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.color.text.secondary};
  white-space: nowrap;
`

const Spacer = styled.span`
  flex: 1;
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`

const StoreSelect = styled.select`
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme }) => theme.color.border.strong};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.white};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

const SwitchLink = styled(Link)`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.brand[700]};
  white-space: nowrap;
`

export function TopBar({ sectionLabel, switchTo, switchLabel }: TopBarProps) {
  const { store, setStore } = useStore()
  return (
    <Header>
      <Inner>
        <Brand to="/">Amara + Zeann</Brand>
        <SectionTag>{sectionLabel}</SectionTag>
        <Spacer />
        <Controls>
          <StoreBadge store={store} />
          {/* PHASE-0 PLACEHOLDER: temporary in-app store switcher until Phase 2
              wires real store assignment/session. */}
          <StoreSelect
            aria-label="Store"
            value={store}
            onChange={(event) => setStore(event.target.value as StoreId)}
          >
            {storeIds.map((id) => (
              <option key={id} value={id}>
                {storeNames[id]}
              </option>
            ))}
          </StoreSelect>
          <SwitchLink to={switchTo}>{switchLabel}</SwitchLink>
        </Controls>
      </Inner>
    </Header>
  )
}
