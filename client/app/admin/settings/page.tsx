"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminRoute } from "@/components/auth/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { getSettings, updateSettings, type StoreSettings } from "@/lib/api/settings"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const s = await getSettings()
        if (!mounted) return
        setSettings(s)
        setError(null)
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load settings')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    try {
      setLoading(true)
      const updated = await updateSettings(settings)
      setSettings(updated)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings')
    } finally {
      setLoading(false)
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
            <h1 className="text-3xl font-bold text-primary">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your store settings and preferences</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Information */}
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Basic information about your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading && <p className="text-sm text-muted-foreground">Loading settings...</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={settings?.storeName || ''}
                      onChange={(e) => settings && setSettings({ ...settings, storeName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Store Email</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={settings?.storeEmail || ''}
                      onChange={(e) => settings && setSettings({ ...settings, storeEmail: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Store Phone</Label>
                    <Input
                      id="storePhone"
                      value={settings?.storePhone || ''}
                      onChange={(e) => settings && setSettings({ ...settings, storePhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={settings?.currency || ''}
                      onChange={(e) => settings && setSettings({ ...settings, currency: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Store Address</Label>
                  <Textarea
                    id="storeAddress"
                    value={settings?.storeAddress || ''}
                    onChange={(e) => settings && setSettings({ ...settings, storeAddress: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Business Settings */}
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Business Settings</CardTitle>
                <CardDescription>Configure your business operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings?.taxRate ?? 0}
                    onChange={(e) => settings && setSettings({ ...settings, taxRate: Number(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive email updates about your store</p>
                  </div>
                  <Switch
                    checked={settings?.emailNotifications || false}
                    onCheckedChange={(checked) => settings && setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Order Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified when new orders are placed</p>
                  </div>
                  <Switch
                    checked={settings?.orderNotifications || false}
                    onCheckedChange={(checked) => settings && setSettings({ ...settings, orderNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Inventory Alerts</p>
                    <p className="text-sm text-muted-foreground">Alerts when products are running low</p>
                  </div>
                  <Switch
                    checked={settings?.inventoryAlerts || false}
                    onCheckedChange={(checked) => settings && setSettings({ ...settings, inventoryAlerts: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced */}
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Advanced store configurations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Enable to show maintenance page to customers</p>
                  </div>
                  <Switch
                    checked={settings?.maintenanceMode || false}
                    onCheckedChange={(checked) => settings && setSettings({ ...settings, maintenanceMode: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" className="bg-transparent" onClick={() => setSettings(settings)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
    </AdminRoute>
  )
}
