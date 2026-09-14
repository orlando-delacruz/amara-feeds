import { useContext } from 'react'
import { CartContext } from './CartContext'
import type { CartContextValue } from './CartContext'

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
