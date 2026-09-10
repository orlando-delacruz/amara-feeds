export const storeIds = ['amara', 'zeann'] as const

export type StoreId = (typeof storeIds)[number]

export const storeNames: Record<StoreId, string> = {
  amara: 'Amara',
  zeann: 'Zeann',
}
