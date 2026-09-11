import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { storeIds, storeNames } from '@/store/stores'
import { useStore } from '@/store/useStore'
import type { StoreId } from '@/store/stores'

// Admin-only store-context switch for store-scoped pages. Staff are locked to
// their assigned store, so nothing renders for them. Lives on the pages where
// the store context applies — the header only displays the current store.
export function StoreControl() {
  const { store, setStore, canSwitchStore } = useStore()
  if (!canSwitchStore) {
    return null
  }
  return (
    <SegmentedControl
      label="Store"
      options={storeIds.map((id) => ({ value: id, label: storeNames[id] }))}
      value={store}
      onChange={(value) => setStore(value as StoreId)}
    />
  )
}
