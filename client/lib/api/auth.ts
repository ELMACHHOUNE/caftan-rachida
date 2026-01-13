// Authentication API functions
import { apiClient, setToken, removeToken, type ApiResponse, type AuthResponse, type User } from './client'

// Login user
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    console.log('Attempting login with:', { email, password: '***' })
    
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    })
    
    console.log('Login response:', response)
    
    if (response.status === 'success' && response.data?.token) {
      setToken(response.data.token)
      return response.data
    } else {
      throw new Error(response.message || 'Login failed')
    }
  } catch (error) {
    console.error('Login error:', error)
    throw new Error(error instanceof Error ? error.message : 'Login failed')
  }
}

// Register user
export const register = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    console.log('Attempting registration with:', { name, email, password: '***' })
    
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    })
    
    console.log('Registration response:', response)
    
    if (response.status === 'success' && response.data?.token) {
      setToken(response.data.token)
      return response.data
    } else {
      throw new Error(response.message || 'Registration failed')
    }
  } catch (error) {
    console.error('Registration error:', error)
    throw new Error(error instanceof Error ? error.message : 'Registration failed')
  }
}

// Logout user
export const logout = (): void => {
  removeToken()
}

// Get current user profile
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<{ user: User }>('/auth/me')
    
    if (response.status === 'success' && response.data?.user) {
      return response.data.user
    } else {
      throw new Error(response.message || 'Failed to fetch user profile')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch user profile')
  }
}

// Update user profile
export const updateProfile = async (
  profileData:
    | {
        name?: string
        phone?: string
        address?: {
          street?: string
          city?: string
          state?: string
          zipCode?: string
          country?: string
        }
      }
    | FormData,
): Promise<User> => {
  try {
    const response = await apiClient.put<{ user: User }>('/auth/profile', profileData)
    
    if (response.status === 'success' && response.data?.user) {
      return response.data.user
    } else {
      throw new Error(response.message || 'Failed to update profile')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update profile')
  }
}

// Change password
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    
    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to change password')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to change password')
  }
}

// Verify token
export const verifyToken = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/auth/verify-token')
    return response.status === 'success'
  } catch (error) {
    return false
  }
}