import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CartContext } from './CartContext'
import type { CartLine } from './CartContext'

interface CartProviderProps {
  children: ReactNode
  // Omitted (default) starts with an empty cart. Explicit initial lines let
  // tests seed the cart before rendering a page.
  initialLines?: CartLine[]
}

export function CartProvider({ children, initialLines }: CartProviderProps) {
  const [lines, setLines] = useState<CartLine[]>(initialLines ?? [])

  const addLine = useCallback((line: CartLine) => {
    setLines((current) => {
      const existing = current.find((item) => item.productId === line.productId)
      if (existing) {
        return current.map((item) =>
          item.productId === line.productId
            ? {
                ...item,
                quantity: item.quantity + line.quantity,
                unitPriceMinor: line.unitPriceMinor,
              }
            : item,
        )
      }
      return [...current, line]
    })
  }, [])

  const removeLine = useCallback((productId: string) => {
    setLines((current) => current.filter((item) => item.productId !== productId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo(
    () => ({ lines, addLine, removeLine, clear }),
    [lines, addLine, removeLine, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
