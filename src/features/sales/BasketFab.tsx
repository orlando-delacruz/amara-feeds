import styled from 'styled-components'
import { Icon } from '@/components/ui/icons'
import { useCart } from '@/features/sales/useCart'

const Fab = styled.button`
  position: fixed;
  right: ${({ theme }) => theme.space.lg};
  bottom: calc(
    ${({ theme }) => theme.layout.tabBarHeight} + env(safe-area-inset-bottom, 0px) +
      ${({ theme }) => theme.space.md}
  );
  z-index: 15;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.color.brand[600]};
  color: ${({ theme }) => theme.color.text.inverse};
  box-shadow: ${({ theme }) => theme.shadow.paint};
  cursor: pointer;
  transition:
    background-color ${({ theme }) => theme.motion.fast} ease-out,
    transform ${({ theme }) => theme.motion.fast} ease-out;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.color.brand[700]};
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    bottom: ${({ theme }) => theme.space.lg};
  }
`

const Badge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 ${({ theme }) => theme.space.xs};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.color.store.zeann.solid};
  color: ${({ theme }) => theme.color.text.inverse};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  font-variant-numeric: tabular-nums;
`

interface BasketFabProps {
  onClick: () => void
}

export function BasketFab({ onClick }: BasketFabProps) {
  const cart = useCart()
  const count = cart.lines.reduce((total, line) => total + line.quantity, 0)
  return (
    <Fab type="button" onClick={onClick} aria-label="Open cart">
      <Icon name="cart" />
      {count > 0 && <Badge aria-hidden="true">{count}</Badge>}
    </Fab>
  )
}