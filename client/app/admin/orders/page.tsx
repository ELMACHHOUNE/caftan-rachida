"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminRoute } from "@/components/auth/ProtectedRoute"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Truck, CheckCircle } from "lucide-react"
import { getAllOrders, formatOrderStatus, formatPrice, type Order } from "@/lib/api/orders"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalOrders, setTotalOrders] = useState(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await getAllOrders({ limit: 50 })
        if (!mounted) return
        setOrders(res.orders)
        setTotalOrders(res.pagination.totalOrders)
        setError(null)
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load orders')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1
    })
    return counts
  }, [orders])

  return (
    <AdminRoute>
      <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-primary">Order Management</h1>
            <p className="text-muted-foreground mt-2">Track and manage all customer orders</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalOrders}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{statusCounts['pending'] || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{statusCounts['processing'] || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{statusCounts['delivered'] || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="border-2 border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Order ID</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Customer</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Product</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Amount</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6 font-medium text-foreground">{order.id}</td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-foreground">{order.shippingAddress?.fullName || 'Customer'}</p>
                            <p className="text-xs text-muted-foreground">{order.paymentResult?.email_address || ''}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">
                          {order.orderItems?.[0]?.name || `${order.orderItems?.length || 0} items`}
                        </td>
                        <td className="py-4 px-6 font-semibold text-foreground">{formatPrice(order.totalPrice)}</td>
                        <td className="py-4 px-6 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6">
                          {(() => {
                            const s = formatOrderStatus(order.status)
                            return (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                                {s.label}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === "processing" && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600">
                                <Truck className="h-4 w-4" />
                              </Button>
                            )}
                            {order.status === "shipped" && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading orders...</p>
                </div>
              )}
              {error && (
                <div className="text-center py-12">
                  <p className="text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
    </AdminRoute>
  )
}
