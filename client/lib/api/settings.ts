// Store settings API
import { apiClient } from './client'

export interface StoreSettings {
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  currency: string
  taxRate: number
  emailNotifications: boolean
  orderNotifications: boolean
  inventoryAlerts: boolean
  maintenanceMode: boolean
  updatedAt?: string
  createdAt?: string
}

export const getSettings = async (): Promise<StoreSettings> => {
  const res = await apiClient.get<{ settings: StoreSettings }>("/settings")
  if (res.status === 'success' && res.data?.settings) {
    return res.data.settings
  }
  throw new Error(res.message || 'Failed to fetch settings')
}

export const updateSettings = async (payload: Partial<StoreSettings>): Promise<StoreSettings> => {
  const res = await apiClient.put<{ settings: StoreSettings }>("/settings", payload)
  if (res.status === 'success' && res.data?.settings) {
    return res.data.settings
  }
  throw new Error(res.message || 'Failed to update settings')
}

export interface PublicSettings {
  currency: string
  storePhone: string
}

export const getPublicSettings = async (): Promise<PublicSettings> => {
  const res = await apiClient.get<{ settings: PublicSettings }>("/settings/public")
  if (res.status === 'success' && res.data?.settings) {
    return res.data.settings
  }
  throw new Error(res.message || 'Failed to fetch public settings')
}
