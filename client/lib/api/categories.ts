// Category-related API functions
import { apiClient, type ApiResponse } from './client'

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: {
    url: string
    public_id?: string
    alt?: string
  }
  parentCategory?: string | Category
  subcategories?: Category[]
  isActive: boolean
  sortOrder: number
  metaTitle?: string
  metaDescription?: string
  productCount?: number
  createdAt: string
  updatedAt: string
}

// Get all categories
export const getCategories = async (includeInactive: boolean = false): Promise<Category[]> => {
  try {
    const queryParams = includeInactive ? '?includeInactive=true' : ''
    const response = await apiClient.get<{ categories: Category[] }>(`/categories${queryParams}`)
    
    if (response.status === 'success' && response.data?.categories) {
      return response.data.categories
    } else {
      throw new Error(response.message || 'Failed to fetch categories')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch categories')
  }
}

// Get category tree structure
export const getCategoryTree = async (): Promise<Category[]> => {
  try {
    const response = await apiClient.get<{ categories: Category[] }>('/categories/tree')
    
    if (response.status === 'success' && response.data?.categories) {
      return response.data.categories
    } else {
      throw new Error(response.message || 'Failed to fetch category tree')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch category tree')
  }
}

// Get single category by ID
export const getCategory = async (id: string): Promise<Category> => {
  try {
    const response = await apiClient.get<{ category: Category }>(`/categories/${id}`)
    
    if (response.status === 'success' && response.data?.category) {
      return response.data.category
    } else {
      throw new Error(response.message || 'Category not found')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch category')
  }
}

// Get categories with product counts
export const getCategoriesWithCounts = async (): Promise<Category[]> => {
  try {
    const response = await apiClient.get<{ categories: Category[] }>('/categories')
    
    if (response.status === 'success' && response.data?.categories) {
      return response.data.categories
    } else {
      throw new Error(response.message || 'Failed to fetch categories with counts')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch categories with counts')
  }
}

// Admin: Create category
export const createCategory = async (
  categoryData:
    | {
        name: string
        description?: string
        parentCategory?: string
        sortOrder?: number
        image?: {
          url: string
          public_id?: string
          alt?: string
        }
        metaTitle?: string
        metaDescription?: string
      }
    | FormData,
): Promise<Category> => {
  try {
    const response = await apiClient.post<{ category: Category }>('/categories', categoryData)
    
    if (response.status === 'success' && response.data?.category) {
      return response.data.category
    } else {
      throw new Error(response.message || 'Failed to create category')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create category')
  }
}

// Admin: Update category
export const updateCategory = async (id: string, categoryData: Partial<Category> | FormData): Promise<Category> => {
  try {
    const response = await apiClient.put<{ category: Category }>(`/categories/${id}`, categoryData)
    
    if (response.status === 'success' && response.data?.category) {
      return response.data.category
    } else {
      throw new Error(response.message || 'Failed to update category')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update category')
  }
}

// Admin: Delete category
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete(`/categories/${id}`)
    
    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to delete category')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete category')
  }
}