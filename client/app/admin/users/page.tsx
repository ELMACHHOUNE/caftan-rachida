"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminRoute } from "@/components/auth/ProtectedRoute"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, Trash2, Mail } from "lucide-react"
import { getUsers, deleteUser, updateUser, type AdminUser } from "@/lib/api/users"

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const loadUsers = async () => {
      try {
        setLoading(true)
        const res = await getUsers({ limit: 50, search: searchQuery })
        if (!mounted) return
        setUsers(res.users)
        setError(null)
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : "Failed to load users")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadUsers()
    return () => { mounted = false }
  }, [searchQuery])

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [users, searchQuery])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete user")
    }
  }

  const handleToggleActive = async (user: AdminUser) => {
    try {
      const updated = await updateUser(user.id, { isActive: !user.isActive })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update user status")
    }
  }

  return (
    <AdminRoute>
      <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-primary">User Management</h1>
            <p className="text-muted-foreground mt-2">View and manage customer accounts</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Search */}
          <Card className="border-2 border-border">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="border-2 border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Name</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Email</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Role</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Joined</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6 font-medium text-foreground">{user.name}</td>
                        <td className="py-4 px-6 text-muted-foreground">{user.email}</td>
                        <td className="py-4 px-6 text-muted-foreground capitalize">{user.role}</td>
                        <td className="py-4 px-6 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleToggleActive(user)}>
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              )}
              {error && (
                <div className="text-center py-12">
                  <p className="text-destructive">{error}</p>
                </div>
              )}
              {!loading && !error && filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No users found matching your search.</p>
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
