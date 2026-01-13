"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminRoute } from "@/components/auth/ProtectedRoute"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { getCategories, createCategory, updateCategory, deleteCategory, type Category } from "@/lib/api/categories"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

export default function AdminCategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    parentCategory: "",
    sortOrder: "0",
    imageUrl: "",
    isActive: true,
    metaTitle: "",
    metaDescription: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const list = await getCategories(true)
        if (!mounted) return
        setCategories(list)
        setError(null)
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load categories')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [categories, searchQuery])

  const openCreateModal = () => {
    setEditingCategory(null)
    setForm({
      name: "",
      description: "",
      parentCategory: "",
      sortOrder: "0",
      imageUrl: "",
      isActive: true,
      metaTitle: "",
      metaDescription: "",
    })
    setImageFile(null)
    setIsOpen(true)
  }

  const openEditModal = (c: Category) => {
    setEditingCategory(c)
    setForm({
      name: c.name || "",
      description: c.description || "",
      parentCategory: typeof c.parentCategory === 'string' ? c.parentCategory : (c.parentCategory?._id || ""),
      sortOrder: String(c.sortOrder ?? 0),
      imageUrl: c.image?.url || "",
      isActive: !!c.isActive,
      metaTitle: c.metaTitle || "",
      metaDescription: c.metaDescription || "",
    })
    setImageFile(null)
    setIsOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const hasName = !!form.name.trim()
      if (!hasName) {
        setError("Name is required")
        return
      }
      const shouldUseFormData = !!imageFile
      if (shouldUseFormData) {
        const fd = new FormData()
        fd.append('name', form.name.trim())
        if (form.description) fd.append('description', form.description.trim())
        if (form.parentCategory) fd.append('parentCategory', form.parentCategory)
        fd.append('sortOrder', String(Number(form.sortOrder) || 0))
        fd.append('isActive', String(!!form.isActive))
        if (form.metaTitle) fd.append('metaTitle', form.metaTitle)
        if (form.metaDescription) fd.append('metaDescription', form.metaDescription)
        if (imageFile) fd.append('image', imageFile)

        if (editingCategory) {
          const updated = await updateCategory(editingCategory._id, fd as any)
          setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))
        } else {
          const created = await createCategory(fd as any)
          setCategories((prev) => [created, ...prev])
        }
      } else {
        const payload: any = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          parentCategory: form.parentCategory || undefined,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: !!form.isActive,
          metaTitle: form.metaTitle || undefined,
          metaDescription: form.metaDescription || undefined,
          image: form.imageUrl ? { url: form.imageUrl } : undefined,
        }
        if (editingCategory) {
          const updated = await updateCategory(editingCategory._id, payload)
          setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))
        } else {
          const created = await createCategory(payload)
          setCategories((prev) => [created, ...prev])
        }
      }
      setIsOpen(false)
      setEditingCategory(null)
      setImageFile(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save category')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c._id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete category')
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-primary">Category Management</h1>
                <p className="text-muted-foreground mt-2">Create, edit, and manage product categories</p>
              </div>
              <Button className="gap-2" onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Add New Category
              </Button>
            </div>
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
                  placeholder="Search categories by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories Table */}
          <Card className="border-2 border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Name</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Parent</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Sort Order</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((c) => (
                      <tr key={c._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6 font-medium text-foreground">{c.name}</td>
                        <td className="py-4 px-6 text-muted-foreground">{(typeof c.parentCategory === 'object' ? c.parentCategory?.name : '') || '-'}</td>
                        <td className="py-4 px-6 text-muted-foreground">{c.sortOrder ?? 0}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {c.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditModal(c)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(c._id)}>
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
                  <p className="text-muted-foreground">Loading categories...</p>
                </div>
              )}
              {error && (
                <div className="text-center py-12">
                  <p className="text-destructive">{error}</p>
                </div>
              )}
              {!loading && !error && filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No categories found.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create/Edit Category Modal */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <div className="hidden" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? "Update category details and save changes." : "Fill in the details to add a new category."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description (optional)" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Parent Category (optional)</Label>
                  <select
                    className="w-full rounded-md border-2 border-border bg-background p-2"
                    value={form.parentCategory}
                    onChange={(e) => setForm({ ...form, parentCategory: e.target.value })}
                  >
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Sort Order</Label>
                    <Input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category Image</Label>
                    <div className="space-y-2">
                      <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                      <p className="text-xs text-muted-foreground">Upload an image file. You can still provide an image URL below as a fallback.</p>
                      <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://... (optional)" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                    Active
                  </label>
                  <div>
                    <Label className="text-sm font-medium">Meta Title</Label>
                    <Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} placeholder="Optional" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Meta Description</Label>
                  <Input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} placeholder="Optional" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsOpen(false); setEditingCategory(null) }}>Cancel</Button>
                <Button onClick={handleSubmit}>{editingCategory ? "Save Changes" : "Create Category"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
    </AdminRoute>
  )
}
