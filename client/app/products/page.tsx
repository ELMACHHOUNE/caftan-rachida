"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { getProducts, type Product } from "@/lib/api/products";
import { useSearchParams } from "next/navigation";
import { formatCurrency, normalizeImageUrl } from "@/lib/utils";

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || undefined;
  const searchParam = searchParams.get("search") || undefined;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getProducts({
          limit: 24,
          sortBy: "createdAt",
          sortOrder: "desc",
          category: categoryParam,
          search: searchParam,
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
  }, [categoryParam, searchParam]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryName = product.category?.name;
      const categoryMatch =
        selectedCategories.length === 0 ||
        (categoryName && selectedCategories.includes(categoryName));
      const basePrice = product.salePrice ?? product.price;
      const priceMatch =
        priceRange === "all" ||
        (priceRange === "low" && basePrice < 250) ||
        (priceRange === "mid" && basePrice >= 250 && basePrice < 350) ||
        (priceRange === "high" && basePrice >= 350);
      return categoryMatch && priceMatch;
    });
  }, [products, selectedCategories, priceRange]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-linear-to-br from-primary via-secondary to-accent text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">
              Our Collection
            </h1>
            <p className="text-xl leading-relaxed opacity-90">
              Discover exquisite Moroccan caftans for every occasion
            </p>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar */}
              <aside className="lg:w-64 shrink-0">
                <div className="sticky top-24">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-primary">Filters</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  <div
                    className={`space-y-6 ${
                      showFilters ? "block" : "hidden lg:block"
                    }`}
                  >
                    {/* Category Filter */}
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">Category</Label>
                      <div className="space-y-2">
                        {availableCategories.map((category) => (
                          <div
                            key={category}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={category}
                              checked={selectedCategories.includes(category)}
                              onCheckedChange={() =>
                                handleCategoryToggle(category)
                              }
                            />
                            <Label
                              htmlFor={category}
                              className="cursor-pointer capitalize"
                            >
                              {category}
                            </Label>
                          </div>
                        ))}
                        {availableCategories.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No categories available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">
                        Price Range
                      </Label>
                      <RadioGroup
                        value={priceRange}
                        onValueChange={setPriceRange}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="price-all" />
                          <Label htmlFor="price-all" className="cursor-pointer">
                            All Prices
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low" id="price-low" />
                          <Label htmlFor="price-low" className="cursor-pointer">
                            Under {formatCurrency(250)}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mid" id="price-mid" />
                          <Label htmlFor="price-mid" className="cursor-pointer">
                            {formatCurrency(250)} - {formatCurrency(350)}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high" id="price-high" />
                          <Label
                            htmlFor="price-high"
                            className="cursor-pointer"
                          >
                            {formatCurrency(350)}+
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Clear Filters */}
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => {
                        setSelectedCategories([]);
                        setPriceRange("all");
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </aside>

              {/* Products Grid */}
              <div className="flex-1">
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {loading ? (
                      <span>Loading products...</span>
                    ) : error ? (
                      <span className="text-destructive">{error}</span>
                    ) : (
                      <>
                        Showing{" "}
                        <span className="font-semibold text-foreground">
                          {filteredProducts.length}
                        </span>{" "}
                        products
                      </>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <Link key={product._id} href={`/products/${product._id}`}>
                      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-border hover:border-accent">
                        <div className="relative aspect-3/4 overflow-hidden bg-muted">
                          <img
                            src={
                              normalizeImageUrl(product.images?.[0]?.url) ||
                              "/placeholder.svg"
                            }
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <CardContent className="p-4 space-y-2">
                          <h3 className="font-semibold text-lg text-primary">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <p className="text-muted-foreground">Price</p>
                              {product.onSale && product.salePrice ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-accent">
                                    {formatCurrency(product.salePrice)}
                                  </span>
                                  <span className="text-muted-foreground line-through">
                                    {formatCurrency(product.price)}
                                  </span>
                                </div>
                              ) : (
                                <p className="font-bold text-foreground">
                                  {formatCurrency(product.price)}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground">Category</p>
                              <p className="font-bold text-foreground">
                                {product.category?.name}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {!loading && !error && filteredProducts.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-xl text-muted-foreground">
                      No products match your filters
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        setSelectedCategories([]);
                        setPriceRange("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
