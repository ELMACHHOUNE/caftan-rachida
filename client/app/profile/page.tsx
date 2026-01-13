"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { updateProfile, getCurrentUser } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/client"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { user, updateUser, refetchUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    }
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "+212652901122",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "Guelmim",
          state: user.address?.state || "",
          zipCode: user.address?.zipCode || "",
          country: user.address?.country || "Morocco"
        }
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSaving(true)

    try {
      let responseUser
      if (avatarFile) {
        const fd = new FormData()
        fd.append('name', formData.name)
        if (formData.phone) fd.append('phone', formData.phone)
        const hasAddress = formData.address.street || formData.address.city || formData.address.state || formData.address.zipCode || formData.address.country
        if (hasAddress) fd.append('address', JSON.stringify(formData.address))
        fd.append('avatar', avatarFile)
        const response = await updateProfile(fd as any)
        responseUser = response
      } else {
        const updateData = {
          name: formData.name,
          phone: formData.phone || undefined,
          address: formData.address.street || formData.address.city ? formData.address : undefined
        }
        const response = await updateProfile(updateData)
        responseUser = response
      }
      const response = { user: responseUser } as any
      updateUser(responseUser as any)
      setSuccess("Profile updated successfully!")
      setIsEditing(false)
      setAvatarFile(null)
      
      // Refetch user to ensure we have the latest data
      setTimeout(() => {
        refetchUser()
        setSuccess("")
      }, 2000)
      
    } catch (error) {
      setError(handleApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          zipCode: user.address?.zipCode || "",
          country: user.address?.country || ""
        }
      })
    }
    setIsEditing(false)
    setError("")
    setSuccess("")
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading profile...</span>
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
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
              <p className="text-muted-foreground">Manage your account information and preferences</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Profile Overview Card */}
              <div className="md:col-span-1">
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle>{user?.name}</CardTitle>
                    <CardDescription>{user?.email}</CardDescription>
                    <div className="mt-3">
                      <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                        {user?.role === 'admin' ? 'Administrator' : 'Customer'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center space-y-3">
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                    {user?.emailVerified !== false && (
                      <div className="flex items-center justify-center text-sm text-green-600">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Verified
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Profile Details Card */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your personal information</CardDescription>
                    </div>
                    {!isEditing && (
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(true)}
                        className="ml-4"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {error && (
                      <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="mb-6 p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                        {success}
                      </div>
                    )}

                    {isEditing ? (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                              disabled={isSaving}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              value={user?.email || ""}
                              disabled
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              disabled={isSaving}
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-base font-medium">Profile Picture</Label>
                          <div className="mt-2 space-y-2">
                            <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                            <p className="text-xs text-muted-foreground">Upload a new avatar image (optional).</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-base font-medium">Address Information</Label>
                          <div className="grid gap-4 mt-3">
                            <div className="grid gap-2">
                              <Label htmlFor="street">Street Address</Label>
                              <Input
                                id="street"
                                type="text"
                                placeholder="123 Main Street"
                                value={formData.address.street}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  address: { ...formData.address, street: e.target.value }
                                })}
                                disabled={isSaving}
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                  id="city"
                                  type="text"
                                  placeholder="New York"
                                  value={formData.address.city}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    address: { ...formData.address, city: e.target.value }
                                  })}
                                  disabled={isSaving}
                                />
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                  id="state"
                                  type="text"
                                  placeholder="NY"
                                  value={formData.address.state}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    address: { ...formData.address, state: e.target.value }
                                  })}
                                  disabled={isSaving}
                                />
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="grid gap-2">
                                <Label htmlFor="zipCode">Zip Code</Label>
                                <Input
                                  id="zipCode"
                                  type="text"
                                  placeholder="10001"
                                  value={formData.address.zipCode}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    address: { ...formData.address, zipCode: e.target.value }
                                  })}
                                  disabled={isSaving}
                                />
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                  id="country"
                                  type="text"
                                  placeholder="United States"
                                  value={formData.address.country}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    address: { ...formData.address, country: e.target.value }
                                  })}
                                  disabled={isSaving}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t">
                          <Button 
                            type="submit" 
                            disabled={isSaving}
                            className="flex-1 sm:flex-none"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleCancel}
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid gap-4">
                          <div className="flex items-center space-x-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{user?.name}</p>
                              <p className="text-sm text-muted-foreground">Full Name</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{user?.email}</p>
                              <p className="text-sm text-muted-foreground">Email Address</p>
                            </div>
                          </div>

                          {user?.phone && (
                            <div className="flex items-center space-x-3">
                              <Phone className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{user.phone}</p>
                                <p className="text-sm text-muted-foreground">Phone Number</p>
                              </div>
                            </div>
                          )}

                          {(user?.address?.street || user?.address?.city) && (
                            <div className="flex items-start space-x-3">
                              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <div className="font-medium">
                                  {user.address.street && <p>{user.address.street}</p>}
                                  <p>
                                    {[user.address.city, user.address.state, user.address.zipCode]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </p>
                                  {user.address.country && <p>{user.address.country}</p>}
                                </div>
                                <p className="text-sm text-muted-foreground">Address</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {!user?.phone && !user?.address?.street && !user?.address?.city && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No additional profile information added yet.</p>
                            <p className="text-sm mt-1">Click "Edit Profile" to add your phone number and address.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}