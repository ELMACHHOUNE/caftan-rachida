"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { getUserOrders, formatOrderStatus, formatPrice, type Order } from "@/lib/api/orders"
import { handleApiError } from "@/lib/api/client"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Calendar, 
  Truck, 
  CreditCard, 
  Eye, 
  Loader2, 
  ShoppingBag,
  Filter,
  ChevronDown,
  AlertCircle,
  MessageCircle
} from "lucide-react"

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const loadOrders = async (page = 1, status = "", append = false) => {
    try {
      if (!append) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError("")

      const params = {
        page,
        limit: 10,
        ...(status && { status })
      }

      const response = await getUserOrders(params)
      
      if (append) {
        setOrders(prev => [...prev, ...response.orders])
      } else {
        setOrders(response.orders)
      }
      
      setCurrentPage(response.pagination.currentPage)
      setTotalPages(response.pagination.totalPages)
      
    } catch (error) {
      setError(handleApiError(error))
      if (!append) {
        setOrders([])
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    loadOrders(1, statusFilter)
  }, [statusFilter])

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    setCurrentPage(1)
  }

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      loadOrders(currentPage + 1, statusFilter, true)
    }
  }

  const getOrderItemsCount = (order: Order): number => {
    return order.orderItems.reduce((total, item) => total + item.quantity, 0)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading your orders...</span>
            </div>
          </main>
          <Footer />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-1 py-8 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">My Orders</h1>
              <p className="text-muted-foreground">Track and manage your order history</p>
            </div>

            {/* Filter Section */}
            <div className="mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={statusFilter === "" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange("")}
                      >
                        All Orders
                      </Button>
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFilterChange(status)}
                        >
                          {formatOrderStatus(status).label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {error && (
              <div className="mb-6">
                <Card className="border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <p>{error}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {orders.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No orders found</h3>
                    <p className="text-muted-foreground mb-6">
                      {statusFilter 
                        ? `You don't have any ${formatOrderStatus(statusFilter).label.toLowerCase()} orders yet.`
                        : "You haven't placed any orders yet. Start shopping to see your orders here!"
                      }
                    </p>
                    <Button asChild>
                      <Link href="/products">
                        Start Shopping
                      </Link>
                    </Button>
                    
                    {/* WhatsApp Contact */}
                    <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-center">
                        <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-green-800 mb-2">Need Help?</h4>
                        <p className="text-green-700 mb-4">
                          Welcome to rent or buy exquisite traditional caftans for your special moments
                        </p>
                        <a 
                          href="https://wa.me/212652901122?text=Hello%2C%20I%27m%20interested%20in%20your%20caftans"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Contact us on WhatsApp
                        </a>
                        <p className="text-sm text-green-600 mt-2">+212652901122</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusInfo = formatOrderStatus(order.status)
                  const itemsCount = getOrderItemsCount(order)
                  
                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-3 mb-2">
                              <span>Order #{order.id.slice(-8).toUpperCase()}</span>
                              <Badge className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Placed on {formatDate(order.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="h-4 w-4" />
                                {itemsCount} item{itemsCount !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-4 w-4" />
                                {formatPrice(order.totalPrice)}
                              </span>
                            </CardDescription>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-4">
                          {/* Order Items Preview */}
                          <div>
                            <h4 className="font-medium mb-3">Items</h4>
                            <div className="grid gap-3">
                              {order.orderItems.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex items-center space-x-3 py-2">
                                  <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-md"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span>Qty: {item.quantity}</span>
                                      <span>{formatPrice(item.price)}</span>
                                      {item.size && <span>Size: {item.size}</span>}
                                      {item.color && <span>Color: {item.color}</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {order.orderItems.length > 3 && (
                                <div className="text-sm text-muted-foreground py-2">
                                  +{order.orderItems.length - 3} more item{order.orderItems.length - 3 !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Shipping Info */}
                          <div className="pt-4 border-t">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium mb-1">Shipping Address</h4>
                                <p className="text-sm text-muted-foreground">
                                  {order.shippingAddress.fullName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {order.shippingAddress.address}, {order.shippingAddress.city}
                                </p>
                              </div>
                              
                              {order.trackingNumber && (
                                <div className="text-right">
                                  <h4 className="font-medium mb-1 text-sm">Tracking</h4>
                                  <p className="text-sm font-mono text-muted-foreground">
                                    {order.trackingNumber}
                                  </p>
                                </div>
                              )}
                              
                              {order.estimatedDelivery && (
                                <div className="text-right">
                                  <h4 className="font-medium mb-1 text-sm flex items-center gap-1">
                                    <Truck className="h-4 w-4" />
                                    Estimated Delivery
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(order.estimatedDelivery)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {/* Load More Button */}
                {currentPage < totalPages && (
                  <div className="text-center pt-6">
                    <Button 
                      variant="outline" 
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Orders
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* WhatsApp Contact Section */}
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-800 mb-3">Questions About Your Orders?</h3>
                    <p className="text-green-700 mb-6 max-w-2xl mx-auto">
                      Welcome to rent or buy exquisite traditional caftans for your special moments.
                      Contact us directly on WhatsApp for instant support with your orders, sizing, or any questions.
                    </p>
                    <a 
                      href="https://wa.me/212652901122?text=Hello%2C%20I%20have%20questions%20about%20my%20order"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Chat with us on WhatsApp
                    </a>
                    <p className="text-green-600 mt-3 font-medium">+212652901122</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}