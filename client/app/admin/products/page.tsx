"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
} from "@/lib/api/products";
import { getCategories, type Category } from "@/lib/api/categories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, normalizeImageUrl } from "@/lib/utils";

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    imageUrl: "",
    onSale: false,
    salePrice: "",
    featured: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getProducts({
          limit: 50,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        if (!mounted) return;
        setProducts(res.products);
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load categories for the form
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats = await getCategories();
        if (!mounted) return;
        setCategories(cats);
      } catch (_) {
        // ignore; form will show empty list
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      name: "",
      description: "",
      price: "",
      category: categories[0]?._id || "",
      stock: "",
      imageUrl: "",
      onSale: false,
      salePrice: "",
      featured: false,
    });
    setImageFile(null);
    setIsOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name || "",
      description: p.description || "",
      price: String(p.price ?? ""),
      category: p.category?._id || "",
      stock: String(p.stock ?? ""),
      imageUrl: normalizeImageUrl(p.images?.[0]?.url) || "",
      onSale: !!p.onSale,
      salePrice: p.salePrice ? String(p.salePrice) : "",
      featured: !!p.featured,
    });
    setImageFile(null);
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const baseValidation =
        !!form.name &&
        !!form.description &&
        !!form.price &&
        !!form.category &&
        form.stock !== "";
      if (!baseValidation) {
        setError("Please fill all required fields");
        return;
      }
      const shouldUseFormData = !!imageFile;
      if (shouldUseFormData) {
        const fd = new FormData();
        fd.append("name", form.name.trim());
        fd.append("description", form.description.trim());
        fd.append("price", String(Number(form.price)));
        fd.append("category", form.category);
        fd.append("stock", String(Number(form.stock)));
        fd.append("featured", String(!!form.featured));
        fd.append("onSale", String(!!form.onSale));
        if (form.onSale && form.salePrice) {
          fd.append("salePrice", String(Number(form.salePrice)));
        }
        if (imageFile) {
          fd.append("image", imageFile);
        }
        if (editingProduct) {
          const updated = await updateProduct(editingProduct._id, fd as any);
          setProducts((prev) =>
            prev.map((p) => (p._id === updated._id ? updated : p))
          );
        } else {
          const created = await createProduct(fd as any);
          setProducts((prev) => [created, ...prev]);
        }
      } else {
        const payload: Partial<Product> = {
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          category: form.category as any,
          stock: Number(form.stock),
          images: form.imageUrl ? [{ url: form.imageUrl }] : [],
          onSale: !!form.onSale,
          salePrice:
            form.onSale && form.salePrice ? Number(form.salePrice) : undefined,
          featured: !!form.featured,
        };
        if (editingProduct) {
          const updated = await updateProduct(editingProduct._id, payload);
          setProducts((prev) =>
            prev.map((p) => (p._id === updated._id ? updated : p))
          );
        } else {
          const created = await createProduct(payload);
          setProducts((prev) => [created, ...prev]);
        }
      }
      setIsOpen(false);
      setEditingProduct(null);
      setImageFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete product");
    }
  };

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
                  <h1 className="text-3xl font-bold text-primary">
                    Product Management
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Manage your caftan inventory and listings
                  </p>
                </div>
                <Button className="gap-2" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  Add New Product
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
                    placeholder="Search products by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card className="border-2 border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-4 px-6 font-semibold text-foreground">
                          Product Name
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">
                          Category
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">
                          Buy Price
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">
                          Sale Price
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">
                          Stock
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">
                          Status
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr
                          key={product._id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 px-6 font-medium text-foreground">
                            {product.name}
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">
                            {product.category?.name}
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">
                            {product.onSale && product.salePrice
                              ? formatCurrency(product.salePrice)
                              : "-"}
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">
                            {product.stock} units
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                product.isActive
                                  ? "bg-green-100 text-green-800"
                                  : product.stock <= 3
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {product.isActive
                                ? "Active"
                                : product.stock <= 3
                                ? "Low Stock"
                                : "Inactive"}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2">
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <a href={`/products/${product._id}`}>
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEditModal(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => handleDelete(product._id)}
                              >
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
                    <p className="text-muted-foreground">Loading products...</p>
                  </div>
                )}
                {error && (
                  <div className="text-center py-12">
                    <p className="text-destructive">{error}</p>
                  </div>
                )}
                {!loading && !error && filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No products found matching your search.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create/Edit Product Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <div className="hidden" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct
                      ? "Update product details and save changes."
                      : "Fill in the details to add a new product."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Short description"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Price</label>
                      <Input
                        type="number"
                        min={0}
                        value={form.price}
                        onChange={(e) =>
                          setForm({ ...form, price: e.target.value })
                        }
                        placeholder="e.g. 199"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Stock</label>
                      <Input
                        type="number"
                        min={0}
                        value={form.stock}
                        onChange={(e) =>
                          setForm({ ...form, stock: e.target.value })
                        }
                        placeholder="e.g. 10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select
                      className="w-full rounded-md border-2 border-border bg-background p-2"
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                    >
                      <option value="">Select a category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Product Image</label>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setImageFile(e.target.files?.[0] || null)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload an image file. You can still provide an image URL
                        below as a fallback.
                      </p>
                      <Input
                        value={form.imageUrl}
                        onChange={(e) =>
                          setForm({ ...form, imageUrl: e.target.value })
                        }
                        placeholder="https://... (optional)"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) =>
                          setForm({ ...form, featured: e.target.checked })
                        }
                      />
                      Featured
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.onSale}
                        onChange={(e) =>
                          setForm({ ...form, onSale: e.target.checked })
                        }
                      />
                      On Sale
                    </label>
                    <div>
                      <Input
                        type="number"
                        min={0}
                        disabled={!form.onSale}
                        value={form.salePrice}
                        onChange={(e) =>
                          setForm({ ...form, salePrice: e.target.value })
                        }
                        placeholder="Sale price"
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      setEditingProduct(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingProduct ? "Save Changes" : "Create Product"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </AdminRoute>
  );
}
