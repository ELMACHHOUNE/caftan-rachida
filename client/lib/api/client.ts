// API configuration and base client
// IMPORTANT: Treat NEXT_PUBLIC_API_URL as the *API root*.
// Examples:
// - Local dev:  http://localhost:5000/api
// - Vercel:     https://caftan-server.vercel.app/api
//
// We do NOT auto-append `/api` anymore because it can create double-prefix bugs
// when the env var already contains `/api`.
const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Normalize any trailing slashes so callers can safely use endpoints like `/products`.
const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, '')

const API_BASE_URL = normalizeBaseUrl(RAW_BASE_URL)

// Types
export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  message?: string
  data?: T
  errors?: any[]
}

export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  avatar?: string
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  emailVerified?: boolean
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

// Get token from localStorage
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

// Set token to localStorage
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
  }
}

// Remove token from localStorage
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
}

// Base API client with automatic token handling
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = getToken()
    
    const isFormData = typeof window !== 'undefined' && options && (options as any).body instanceof FormData
    const config: RequestInit = {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    // In Next.js Server Components, fetch() runs on the server and can hang for a long time
    // when the upstream is down. Add a reasonable timeout to avoid 30s+ SSR renders.
    const controller = new AbortController()
    const timeoutMs = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 7000)
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      })
      
      if (!response.ok) {
        let errorData: any = null
        try {
          errorData = await response.json()
        } catch (parseError) {
          try {
            const text = await response.text()
            errorData = { status: 'error', message: text || `HTTP ${response.status}: ${response.statusText}` }
          } catch (_) {
            errorData = { status: 'error', message: `HTTP ${response.status}: ${response.statusText}` }
          }
        }
        
        // Handle validation errors specifically
        if (response.status === 400 && errorData?.errors) {
          const validationMessages = errorData.errors.map((err: any) => err.msg || err.message).join(', ')
          throw new Error(`Validation failed: ${validationMessages}`)
        }
        
        const detail = (errorData && (errorData.message || errorData.error)) || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(detail)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      console.error('Request details:', { endpoint, config })
      // JSON.stringify(Error) is usually `{}`; keep it for completeness but include .message too.
      console.error('Full error:', {
        message: (error as any)?.message,
        name: (error as any)?.name,
        stack: (error as any)?.stack,
      })
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const isFormData = typeof window !== 'undefined' && data instanceof FormData
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    })
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const isFormData = typeof window !== 'undefined' && data instanceof FormData
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    })
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL)

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}