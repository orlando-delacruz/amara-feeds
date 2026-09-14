import { createContext } from 'react'

export interface CartLine {
  productId: string
  quantity: number
  unitPriceMinor: number
}

export interface CartContextValue {
  lines: CartLine[]
  addLine: (line: CartLine) => void
  removeLine: (productId: string) => void
  clear: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)