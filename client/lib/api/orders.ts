// Orders API functions
import { apiClient } from './client'

// Order related types
export interface OrderItem {
  product: string
  name: string
  image: string
  price: number
  quantity: number
  size?: string
  color?: string
  sku?: string
}

export interface ShippingAddress {
  fullName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

export interface Order {
  id: string
  user: string
  orderItems: OrderItem[]
  shippingAddress: ShippingAddress
  paymentMethod: string
  paymentResult?: {
    id?: string
    status?: string
    update_time?: string
    email_address?: string
  }
  subtotal: number
  tax: number
  shippingPrice: number
  totalPrice: number
  isPaid: boolean
  paidAt?: string
  isDelivered: boolean
  deliveredAt?: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  trackingNumber?: string
  estimatedDelivery?: string
  createdAt: string
  updatedAt: string
}
// Client-normalized Order type
export interface Order {
  id: string
  user?: any
  orderItems: OrderItem[]
  shippingAddress: ShippingAddress
  paymentMethod: string
  paymentResult?: {
    id?: string
    status?: string
    update_time?: string
    email_address?: string
  }
  subtotal: number
  tax: number
  shippingPrice: number
  totalPrice: number
  isPaid?: boolean
  paidAt?: string
  isDelivered: boolean
  deliveredAt?: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  trackingNumber?: string
  estimatedDelivery?: string
  createdAt: string
  updatedAt: string
}

// Server order shape (partial, as routes may populate differently)
interface ServerOrder {
  _id: string
  user?: any
  orderItems: any[]
  shippingAddress: ShippingAddress
  paymentMethod: string
  paymentResult?: any
  subtotal: number
  taxAmount: number
  shippingCost: number
  totalAmount: number
  isPaid?: boolean
  paidAt?: string
  isDelivered: boolean
  deliveredAt?: string
  orderStatus: Order['status']
  trackingNumber?: string
  estimatedDelivery?: string
  createdAt: string
  updatedAt: string
}

export interface OrdersResponse {
  orders: Order[]
  pagination: {
    currentPage: number
    totalPages: number
    totalOrders: number
    hasMore: boolean
    hasPrev?: boolean
  }
}

export interface CreateOrderData {
  orderItems: {
    product: string
    quantity: number
    size?: string
    color?: string
  }[]
  shippingAddress: ShippingAddress
  paymentMethod: string
}

// Get user orders
export const getUserOrders = async (params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<OrdersResponse> => {
  try {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

  // Map server order to client-normalized shape
  const mapOrder = (s: ServerOrder): Order => {
    return {
      id: s._id,
      user: s.user,
      orderItems: s.orderItems?.map((item: any) => ({
        product: item.product?._id || item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        sku: item.sku,
      })) || [],
      shippingAddress: s.shippingAddress,
      paymentMethod: s.paymentMethod,
      paymentResult: s.paymentResult,
      subtotal: s.subtotal,
      tax: s.taxAmount,
      shippingPrice: s.shippingCost,
      totalPrice: s.totalAmount,
      isPaid: s.isPaid,
      paidAt: s.paidAt,
      isDelivered: s.isDelivered,
      deliveredAt: s.deliveredAt,
      status: s.orderStatus,
      trackingNumber: s.trackingNumber,
      estimatedDelivery: s.estimatedDelivery,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }
  }
    if (params?.status) queryParams.append('status', params.status)
    
    const query = queryParams.toString()
    const endpoint = `/orders/my-orders${query ? `?${query}` : ''}`
    
    const response = await apiClient.get<{ orders: ServerOrder[]; pagination: { currentPage: number; totalPages: number; totalOrders: number; hasNext: boolean; hasPrev: boolean } }>(endpoint)
    
    if (response.status === 'success' && response.data) {
      const { orders, pagination } = response.data
      return {
        orders: orders.map(mapOrder),
        pagination: {
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalOrders: pagination.totalOrders,
          hasMore: pagination.hasNext,
          hasPrev: pagination.hasPrev,
        },
      }
    } else {
      throw new Error(response.message || 'Failed to fetch orders')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch orders')
  }
}

// Get single order by ID
export const getOrderById = async (orderId: string): Promise<Order> => {
  try {
    const response = await apiClient.get<{ order: ServerOrder }>(`/orders/${orderId}`)
    
    if (response.status === 'success' && response.data?.order) {
      return mapOrder(response.data.order)
    } else {
      throw new Error(response.message || 'Failed to fetch order')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch order')
  }
}

// Create new order
export const createOrder = async (orderData: CreateOrderData): Promise<Order> => {
  try {
    const response = await apiClient.post<{ order: ServerOrder }>('/orders', orderData)
    
    if (response.status === 'success' && response.data?.order) {
      return mapOrder(response.data.order)
    } else {
      throw new Error(response.message || 'Failed to create order')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create order')
  }
}

// Cancel order
export const cancelOrder = async (orderId: string, reason?: string): Promise<Order> => {
  try {
    const response = await apiClient.put<{ order: ServerOrder }>(`/orders/${orderId}/cancel`, {
      reason
    })
    
    if (response.status === 'success' && response.data?.order) {
      return mapOrder(response.data.order)
    } else {
      throw new Error(response.message || 'Failed to cancel order')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to cancel order')
  }
}

// Helper function to format order status
export const formatOrderStatus = (status: string): { label: string; color: string } => {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-800' },
    shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' }
  }
  
  return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
}

// Helper function to format price
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MAD'
  }).format(price)
}

// Admin: get all orders
export const getAllOrders = async (params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<OrdersResponse> => {
  try {
    const qs = new URLSearchParams()
    if (params?.page) qs.append('page', String(params.page))
    if (params?.limit) qs.append('limit', String(params.limit))
    if (params?.status) qs.append('status', params.status)
    if (params?.search) qs.append('search', params.search)
    const endpoint = `/orders${qs.toString() ? `?${qs.toString()}` : ''}`

    const response = await apiClient.get<{ orders: ServerOrder[]; pagination: { currentPage: number; totalPages: number; totalOrders: number; hasNext: boolean; hasPrev: boolean } }>(endpoint)
    if (response.status === 'success' && response.data) {
      const { orders, pagination } = response.data
      return {
        orders: orders.map(mapOrder),
        pagination: {
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalOrders: pagination.totalOrders,
          hasMore: pagination.hasNext,
          hasPrev: pagination.hasPrev,
        },
      }
    }
    throw new Error(response.message || 'Failed to fetch orders')
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch orders')
  }
}

// Admin: update order status
export const updateOrderStatus = async (orderId: string, payload: { status: Order['status']; trackingNumber?: string; shippingCarrier?: string }): Promise<Order> => {
  try {
    const response = await apiClient.put<{ order: ServerOrder }>(`/orders/${orderId}/status`, payload)
    if (response.status === 'success' && response.data?.order) {
      return mapOrder(response.data.order)
    }
    throw new Error(response.message || 'Failed to update order status')
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update order status')
  }
}

// Admin: order overview stats
export interface OrdersOverviewStats {
  overview: {
    totalOrders: number
    pendingOrders: number
    deliveredOrders: number
    cancelledOrders: number
    totalRevenue: number
  }
  revenueTrends: Array<{ _id: { year: number; month: number }; revenue: number; orders: number }>
}

export const getOrdersOverview = async (): Promise<OrdersOverviewStats> => {
  try {
    const response = await apiClient.get<OrdersOverviewStats>('/orders/stats/overview')
    if (response.status === 'success' && response.data) {
      return response.data
    }
    throw new Error(response.message || 'Failed to fetch order stats')
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch order stats')
  }
}