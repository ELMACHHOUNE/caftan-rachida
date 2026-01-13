"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Heart,
  Ruler,
  Package,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency, normalizeImageUrl } from "@/lib/utils";
import { getProduct, type Product } from "@/lib/api/products";
import { getPublicSettings } from "@/lib/api/settings";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [currency, setCurrency] = useState<string>("MAD");
  const { addItem, toggleCart } = useCart();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) return;
        const p = await getProduct(id);
        if (mounted) setProduct(p);
      } catch (err) {
        console.error("Failed to load product", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const settings = await getPublicSettings();
        if (mounted && settings.currency) setCurrency(settings.currency);
      } catch (err) {
        console.warn("Failed to load settings currency, defaulting to MAD");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    const sizes = (product.sizes || [])
      .map((s) => s.name || s.value)
      .filter(Boolean);
    if (sizes.length > 0 && !selectedSize) return;
    const price =
      product.onSale && product.salePrice ? product.salePrice : product.price;
    addItem({
      id: product._id,
      name: product.name,
      price: price,
      image: normalizeImageUrl(product.images?.[0]?.url) || "/placeholder.svg",
      size: selectedSize || undefined,
      type: "buy",
    });
    toggleCart();
  };

  if (!id) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-20 bg-background">
          <div className="max-w-3xl mx-auto px-4">
            <p className="text-center text-destructive">Invalid product URL</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-20 bg-background">
          <div className="max-w-3xl mx-auto px-4">
            <p className="text-center text-muted-foreground">
              Loading product...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const sizes = (product.sizes || [])
    .map((s) => s.name || s.value)
    .filter(Boolean);
  const availability = product.stock > 0 ? "In Stock" : "Out of Stock";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted border-2 border-border">
                <img
                  src={
                    normalizeImageUrl(product.images?.[selectedImage]?.url) ||
                    "/placeholder.svg"
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                  {product.category?.name || "Product"}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(product.images || []).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === index
                        ? "border-accent"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <img
                      src={normalizeImageUrl(image.url) || "/placeholder.svg"}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                  {product.name}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price */}
              <Card className="border-2 border-border">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                    <div>
                      <p className="font-semibold">Buy</p>
                      <p className="text-sm text-muted-foreground">
                        Own it forever
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        product.onSale && product.salePrice
                          ? product.salePrice
                          : product.price,
                        currency
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Size Selection */}
              {sizes.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Select Size</Label>
                  <div className="flex gap-3">
                    {sizes.map((size) => (
                      <Button
                        key={size}
                        variant={selectedSize === size ? "default" : "outline"}
                        className={`w-16 h-16 text-lg ${
                          selectedSize === size ? "border-2 border-accent" : ""
                        }`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  size="lg"
                  className="flex-1 h-14 text-lg"
                  onClick={handleAddToCart}
                  disabled={sizes.length > 0 && !selectedSize}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-6 bg-transparent"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              {/* Product Info */}
              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Availability</p>
                    <p className="text-sm text-muted-foreground">
                      {availability}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Ruler className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">SKU</p>
                    <p className="text-sm text-muted-foreground">
                      {product.sku || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Category</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category?.name || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="pt-6 border-t border-border">
                  <h3 className="text-xl font-semibold mb-4">Specifications</h3>
                  <ul className="space-y-2">
                    {product.specifications.map((spec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-accent mt-1">✓</span>
                        <span className="text-muted-foreground">
                          {spec.name}: {spec.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
