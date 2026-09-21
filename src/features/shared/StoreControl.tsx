import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { DEFAULT_ADMIN_STORE, storeIds, storeNames, type StoreContextId } from '@/store/stores'
import { useStore } from '@/store/useStore'

// Admin store-context switch (DEC-040). The combined "All stores" option was
// removed per client request (DEC-048) — admins pick Amara or Zeann; staff
// render nothing — they are locked to their assigned store.
export function StoreControl() {
  const { store, setStore, canSwitchStore } = useStore()
  if (!canSwitchStore) {
    return null
  }
  return (
    <SegmentedControl
      label="Store"
      options={storeIds.map((id) => ({ value: id, label: storeNames[id] }))}
      value={store === 'all' ? DEFAULT_ADMIN_STORE : store}
      onChange={(value) => setStore(value as StoreContextId)}
    />
  )
}
