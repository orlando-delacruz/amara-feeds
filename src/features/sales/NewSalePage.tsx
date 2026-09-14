import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { listProducts, listStorePrices } from '@/services'
import { Button } from '@/components/ui/Button'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { useAsyncData } from '@/features/shared'
import { useCart } from '@/features/sales/useCart'
import { BasketFab } from '@/features/sales/BasketFab'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { Money } from '@/lib/money'
import type { ProductId } from '@/domain'

const CatalogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.space.md};

  @media (min-width: ${({ theme }) => theme.breakpoint.phoneWide}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.desktop}) {
    grid-template-columns: repeat(5, 1fr);
  }
`

const ProductCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  background-color: ${({ theme }) => theme.color.surface.card};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`

const ProductName = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
`

const ProductPrice = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.muted};
  min-height: 1.5em;
`

const QtyRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`

const QtyButton = styled(Button)`
  min-height: ${({ theme }) => theme.touch.minTarget};
  width: 2.5rem;
  padding: 0;
`

const QtyValue = styled.span`
  flex: 1;
  text-align: center;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  font-variant-numeric: tabular-nums;
`

interface NewSalePageProps {
  basePath?: string
}

export function NewSalePage({ basePath = '/sales' }: NewSalePageProps) {
  const navigate = useNavigate()
  const { store } = useStore()
  const cart = useCart()
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const products = useAsyncData(() => listProducts({ status: 'active' }))
  const prices = useAsyncData(() => listStorePrices(store), store)

  function setQuantity(productId: ProductId, quantity: number) {
    setQuantities((current) => ({ ...current, [productId]: Math.max(1, quantity) }))
  }

  function addToCart(productId: ProductId, price: Money) {
    const quantity = quantities[productId] ?? 1
    cart.addLine({ productId, quantity, unitPriceMinor: price })
  }

  return (
    <Stack>
      <PageHeader
        title="New sale"
        description={`Adding items for a sale at ${storeNames[store]}.`}
        actions={
          <Button variant="secondary" onClick={() => navigate(basePath)}>
            Cancel
          </Button>
        }
        size="compact"
      />
      <CatalogGrid>
        {(products.data ?? []).map((product) => {
          const price = prices.data?.[product.id]
          const quantity = quantities[product.id] ?? 1
          return (
            <ProductCard key={product.id}>
              <ProductName>{product.name}</ProductName>
              <ProductPrice>{price !== undefined ? <MoneyText amountMinor={price} /> : 'No price'}</ProductPrice>
              {price !== undefined && (
                <QtyRow>
                  <QtyButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setQuantity(product.id, quantity - 1)}
                    aria-label={`Decrease ${product.name} quantity`}
                  >
                    −
                  </QtyButton>
                  <QtyValue aria-label={`${product.name} quantity`}>{quantity}</QtyValue>
                  <QtyButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setQuantity(product.id, quantity + 1)}
                    aria-label={`Increase ${product.name} quantity`}
                  >
                    +
                  </QtyButton>
                </QtyRow>
              )}
              <Button
                variant="primary"
                size="sm"
                disabled={price === undefined}
                onClick={() => price !== undefined && addToCart(product.id, price)}
              >
                Add to cart
              </Button>
            </ProductCard>
          )
        })}
      </CatalogGrid>
      <BasketFab onClick={() => navigate(`${basePath}/cart`)} />
    </Stack>
  )
}