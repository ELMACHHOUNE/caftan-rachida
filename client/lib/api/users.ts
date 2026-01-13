// Admin Users API functions
import { apiClient } from './client'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  isActive?: boolean
  avatar?: string
  phone?: string
  createdAt: string
}

export interface UsersResponse {
  users: AdminUser[]
  pagination: {
    currentPage: number
    totalPages: number
    totalUsers: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Map server user to client shape
const mapUser = (u: any): AdminUser => ({
  id: u._id || u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  isActive: u.isActive,
  avatar: u.avatar,
  phone: u.phone,
  createdAt: u.createdAt,
})

export const getUsers = async (params?: { page?: number; limit?: number; search?: string; role?: 'user' | 'admin'; isActive?: boolean }): Promise<UsersResponse> => {
  try {
    const qs = new URLSearchParams()
    if (params?.page) qs.append('page', String(params.page))
    if (params?.limit) qs.append('limit', String(params.limit))
    if (params?.search) qs.append('search', params.search)
    if (params?.role) qs.append('role', params.role)
    if (params?.isActive !== undefined) qs.append('isActive', String(params.isActive))

    const endpoint = `/users${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await apiClient.get<{ users: any[]; pagination: { currentPage: number; totalPages: number; totalUsers: number; hasNext: boolean; hasPrev: boolean } }>(endpoint)
    if (res.status === 'success' && res.data) {
      const { users, pagination } = res.data
      return {
        users: users.map(mapUser),
        pagination,
      }
    }
    throw new Error(res.message || 'Failed to fetch users')
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Failed to fetch users')
  }
}

export const getUserById = async (id: string): Promise<AdminUser> => {
  try {
    const res = await apiClient.get<{ user: any }>(`/users/${id}`)
    if (res.status === 'success' && res.data?.user) {
      return mapUser(res.data.user)
    }
    throw new Error(res.message || 'Failed to fetch user')
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Failed to fetch user')
  }
}

export const updateUser = async (id: string, payload: Partial<AdminUser> & { role?: 'user' | 'admin'; isActive?: boolean }): Promise<AdminUser> => {
  try {
    const res = await apiClient.put<{ user: any }>(`/users/${id}`, payload)
    if (res.status === 'success' && res.data?.user) {
      return mapUser(res.data.user)
    }
    throw new Error(res.message || 'Failed to update user')
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Failed to update user')
  }
}

export const deleteUser = async (id: string): Promise<void> => {
  try {
    const res = await apiClient.delete(`/users/${id}`)
    if (res.status !== 'success') {
      throw new Error(res.message || 'Failed to delete user')
    }
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Failed to delete user')
  }
}

export interface UsersOverviewStats {
  overview: {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    adminUsers: number
    recentUsers: number
  }
  registrationTrends: Array<{ _id: { year: number; month: number }; count: number }>
}

export const getUsersOverview = async (): Promise<UsersOverviewStats> => {
  try {
    const res = await apiClient.get<UsersOverviewStats>('/users/stats/overview')
    if (res.status === 'success' && res.data) {
      return res.data
    }
    throw new Error(res.message || 'Failed to fetch user stats')
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Failed to fetch user stats')
  }
}
