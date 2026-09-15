import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { listProducts, listStorePrices } from '@/services'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { MoneyText } from '@/components/ui/MoneyText'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { TextField } from '@/components/ui/TextField'
import { useAsyncData } from '@/features/shared'
import { useCart } from '@/features/sales/useCart'
import { BasketFab } from '@/features/sales/BasketFab'
import { storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { Money } from '@/lib/money'
import type { Product, ProductId } from '@/domain'

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

const QtyField = styled(TextField)`
  min-height: ${({ theme }) => theme.touch.minTarget};
`

interface NewSalePageProps {
  basePath?: string
}

export function NewSalePage({ basePath = '/sales' }: NewSalePageProps) {
  const navigate = useNavigate()
  const { store } = useStore()
  const cart = useCart()
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [quantityError, setQuantityError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const products = useAsyncData(() => listProducts({ status: 'active' }))
  const prices = useAsyncData(() => listStorePrices(store), store)

  const visibleProducts = (products.data ?? [])
    .filter((product) =>
      search.trim() ? product.name.toLowerCase().includes(search.trim().toLowerCase()) : true,
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))

  function addToCart(productId: ProductId, name: string, price: Money) {
    const quantity = Number(quantities[productId] ?? '1')
    if (!Number.isInteger(quantity) || quantity < 1) {
      setQuantityError(`${name}: quantity must be a whole number of at least 1.`)
      return
    }
    setQuantityError(null)
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
      {quantityError && <Alert variant="danger">{quantityError}</Alert>}
      <TextField
        id="product-search"
        label="Search items"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {visibleProducts.length === 0 && (
        <EmptyState
          title={search.trim() ? 'No items match your search' : 'No items available'}
          description={
            search.trim()
              ? 'Try a different search term.'
              : 'Add items at your store to start selling.'
          }
        />
      )}
      <CatalogGrid>
        {visibleProducts.map((product: Product) => {
          const price = prices.data?.[product.id]
          const quantity = quantities[product.id] ?? '1'
          return (
            <ProductCard key={product.id}>
              <ProductName>{product.name}</ProductName>
              <ProductPrice>
                Price per bag:{' '}
                {price !== undefined ? <MoneyText amountMinor={price} /> : 'No price'}
              </ProductPrice>
              {price !== undefined && (
                <QtyField
                  id={`sale-quantity-${product.id}`}
                  label="Quantity"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(event) =>
                    setQuantities((current) => ({ ...current, [product.id]: event.target.value }))
                  }
                  required
                />
              )}
              <Button
                variant="primary"
                size="sm"
                disabled={price === undefined}
                onClick={() => price !== undefined && addToCart(product.id, product.name, price)}
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
