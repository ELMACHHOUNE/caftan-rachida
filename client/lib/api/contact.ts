import { apiClient, type ApiResponse } from './client'

export interface ContactPayload {
  name: string
  email: string
  subject: string
  message: string
}

export const sendContactMessage = async (payload: ContactPayload): Promise<void> => {
  const response = await apiClient.post('/contact', payload)
  if (response.status !== 'success') {
    throw new Error(response.message || 'Failed to send message')
  }
}
