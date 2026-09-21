import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { storeIds, storeNames, type StoreContextId } from '@/store/stores'
import { useStore } from '@/store/useStore'

// Admin store-context switch, relocated to the admin More page (DEC-040).
// Defaults to "All stores" (both stores combined); staff render nothing —
// they are locked to their assigned store.
export function StoreControl() {
  const { store, setStore, canSwitchStore } = useStore()
  if (!canSwitchStore) {
    return null
  }
  return (
    <SegmentedControl
      label="Store"
      options={[
        { value: 'all', label: 'All stores' },
        ...storeIds.map((id) => ({ value: id, label: storeNames[id] })),
      ]}
      value={store}
      onChange={(value) => setStore(value as StoreContextId)}
    />
  )
}
