// Product-related API functions
import { apiClient, type ApiResponse } from './client'

export interface Product {
  _id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  category: {
    _id: string
    name: string
    slug: string
  }
  subcategory?: string
  brand?: string
  images: Array<{
    url: string
    public_id?: string
    alt?: string
  }>
  colors?: Array<{
    name: string
    value: string
    image?: string
  }>
  sizes?: Array<{
    name: string
    value: string
    stock: number
  }>
  stock: number
  sku?: string
  featured: boolean
  onSale: boolean
  salePercentage: number
  salePrice?: number
  tags: string[]
  specifications?: Array<{
    name: string
    value: string
  }>
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  ratings: {
    average: number
    count: number
  }
  reviews: Array<{
    user: {
      _id: string
      name: string
      avatar?: string
    }
    rating: number
    comment: string
    createdAt: string
  }>
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ProductsResponse {
  products: Product[]
  pagination: {
    currentPage: number
    totalPages: number
    totalProducts: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ProductFilters {
  page?: number
  limit?: number
  search?: string
  category?: string
  featured?: boolean
  onSale?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: 'createdAt' | 'price' | 'name' | 'rating'
  sortOrder?: 'asc' | 'desc'
}

// Get all products with optional filters
export const getProducts = async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
  try {
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    const response = await apiClient.get<ProductsResponse>(`/products?${queryParams.toString()}`)
    
    if (response.status === 'success' && response.data) {
      return response.data
    } else {
      throw new Error(response.message || 'Failed to fetch products')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch products')
  }
}

// Get single product by ID
export const getProduct = async (id: string): Promise<Product> => {
  try {
    const response = await apiClient.get<{ product: Product }>(`/products/${id}`)
    
    if (response.status === 'success' && response.data?.product) {
      return response.data.product
    } else {
      throw new Error(response.message || 'Product not found')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch product')
  }
}

// Get featured products
export const getFeaturedProducts = async (limit: number = 8): Promise<Product[]> => {
  try {
    const response = await apiClient.get<{ products: Product[] }>(`/products/featured/list?limit=${limit}`)
    
    if (response.status === 'success' && response.data?.products) {
      return response.data.products
    } else {
      throw new Error(response.message || 'Failed to fetch featured products')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch featured products')
  }
}

// Add product review
export const addProductReview = async (
  productId: string,
  rating: number,
  comment: string
): Promise<any> => {
  try {
    const response = await apiClient.post(`/products/${productId}/reviews`, {
      rating,
      comment,
    })
    
    if (response.status === 'success') {
      return response.data
    } else {
      throw new Error(response.message || 'Failed to add review')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to add review')
  }
}

// Admin: Create product
export const createProduct = async (productData: Partial<Product> | FormData): Promise<Product> => {
  try {
    const response = await apiClient.post<{ product: Product }>('/products', productData)
    
    if (response.status === 'success' && response.data?.product) {
      return response.data.product
    } else {
      throw new Error(response.message || 'Failed to create product')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create product')
  }
}

// Admin: Update product
export const updateProduct = async (id: string, productData: Partial<Product> | FormData): Promise<Product> => {
  try {
    const response = await apiClient.put<{ product: Product }>(`/products/${id}`, productData)
    
    if (response.status === 'success' && response.data?.product) {
      return response.data.product
    } else {
      throw new Error(response.message || 'Failed to update product')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update product')
  }
}

// Admin: Delete product
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete(`/products/${id}`)
    
    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to delete product')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete product')
  }
}