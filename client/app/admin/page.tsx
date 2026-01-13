"use client"

import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminRoute } from "@/components/auth/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react"
import { getOrdersOverview } from "@/lib/api/orders"
import { getUsersOverview } from "@/lib/api/users"
import { getProducts } from "@/lib/api/products"
import { getSettings } from "@/lib/api/settings"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState([
    { title: "Total Revenue", value: "$0", change: "", icon: DollarSign, color: "text-green-600" },
    { title: "Total Products", value: "0", change: "", icon: Package, color: "text-accent" },
    { title: "Total Users", value: "0", change: "", icon: Users, color: "text-blue-600" },
    { title: "Total Orders", value: "0", change: "", icon: ShoppingCart, color: "text-orange-600" },
  ])
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; customer: string; product: string; amount: string; status: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<string>('USD')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const [ordersStats, usersStats, productsRes, settingsRes] = await Promise.all([
          getOrdersOverview(),
          getUsersOverview(),
          getProducts({ limit: 1 }),
          getSettings(),
        ])

        if (!mounted) return
        const totalRevenue = ordersStats.overview.totalRevenue
        const totalOrders = ordersStats.overview.totalOrders
        const totalUsers = usersStats.overview.totalUsers
        const totalProducts = productsRes.pagination.totalProducts

        setCurrency(settingsRes.currency || 'USD')
        setStats([
          { title: "Total Revenue", value: new Intl.NumberFormat('en-US', { style: 'currency', currency: settingsRes.currency || 'USD' }).format(totalRevenue), change: "", icon: DollarSign, color: "text-green-600" },
          { title: "Total Products", value: String(totalProducts), change: "", icon: Package, color: "text-accent" },
          { title: "Total Users", value: String(totalUsers), change: "", icon: Users, color: "text-blue-600" },
          { title: "Total Orders", value: String(totalOrders), change: "", icon: ShoppingCart, color: "text-orange-600" },
        ])

        // Build a simple recent orders list using orders endpoint (fetch first page)
        // Note: If needed, we could add a dedicated API for recent orders.
        setRecentOrders([])
        setError(null)
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : "Failed to load dashboard data")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <AdminRoute>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-primary">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening with your store today.</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title} className="border-2 border-border hover:border-accent transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    {stat.change && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        {stat.change}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Recent Orders */}
          <Card className="border-2 border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-primary">Recent Orders</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Latest customer orders and their status</p>
              </div>
              <a href="/admin/orders" className="text-accent hover:underline flex items-center gap-1 text-sm">
                View all
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Order ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4 font-medium text-foreground">{order.id}</td>
                        <td className="py-4 px-4 text-muted-foreground">{order.customer}</td>
                        <td className="py-4 px-4 text-muted-foreground">{order.product}</td>
                        <td className="py-4 px-4 font-semibold text-foreground">{order.amount}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loading && (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
              )}
              {error && (
                <div className="text-center py-6">
                  <p className="text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-border hover:border-accent transition-colors cursor-pointer">
              <CardContent className="p-6 text-center space-y-3">
                <Package className="h-12 w-12 mx-auto text-accent" />
                <h3 className="font-semibold text-lg text-primary">Add Product</h3>
                <p className="text-sm text-muted-foreground">Add a new caftan to your collection</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border hover:border-accent transition-colors cursor-pointer">
              <CardContent className="p-6 text-center space-y-3">
                <Users className="h-12 w-12 mx-auto text-accent" />
                <h3 className="font-semibold text-lg text-primary">Manage Users</h3>
                <p className="text-sm text-muted-foreground">View and manage customer accounts</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border hover:border-accent transition-colors cursor-pointer">
              <CardContent className="p-6 text-center space-y-3">
                <ShoppingCart className="h-12 w-12 mx-auto text-accent" />
                <h3 className="font-semibold text-lg text-primary">View Orders</h3>
                <p className="text-sm text-muted-foreground">Process and track all orders</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
    </AdminRoute>
  )
}
