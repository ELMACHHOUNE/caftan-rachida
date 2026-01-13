import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Package, Clock, Shield } from "lucide-react";
import { getFeaturedProducts, type Product } from "@/lib/api/products";
import { formatCurrency, normalizeImageUrl } from "@/lib/utils";

export default async function HomePage() {
  let featured: Product[] = [];
  let apiError: string | null = null;
  try {
    featured = await getFeaturedProducts(8);
  } catch (_) {
    featured = [];
    apiError = "Featured products are temporarily unavailable.";
  }

  const features = [
    {
      icon: Sparkles,
      title: "Handcrafted Excellence",
      description:
        "Each caftan is meticulously crafted by skilled Moroccan artisans",
    },
    {
      icon: Package,
      title: "Rent or Buy",
      description:
        "Flexible options to rent for special occasions or purchase forever",
    },
    {
      icon: Clock,
      title: "Fast Delivery",
      description:
        "Express shipping available throughout Morocco and internationally",
    },
    {
      icon: Shield,
      title: "Quality Guaranteed",
      description: "Authentic materials and traditional techniques guaranteed",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground">
          <div className="absolute inset-0 bg-[url('/moroccan-pattern-texture.jpg')] opacity-10 bg-cover bg-center" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-balance">
              Discover Moroccan <br />
              Elegance & Heritage
            </h1>
            <p className="text-xl md:text-2xl opacity-90 leading-relaxed">
              Rent or buy exquisite traditional caftans for your special moments
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products?type=rent">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 h-14"
                >
                  Rent a Caftan
                </Button>
              </Link>
              <Link href="/products?type=buy">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 h-14"
                >
                  Buy a Caftan
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20">
                      <Icon className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-primary">
                Featured Collection
              </h2>
              <p className="text-xl text-muted-foreground">
                Discover our most beloved pieces
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {apiError && (
                <div className="col-span-full rounded-lg border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                  {apiError}
                </div>
              )}
              {featured.map((product) => (
                <Link key={product._id} href={`/products/${product._id}`}>
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-border hover:border-accent">
                    <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                      <img
                        src={
                          normalizeImageUrl(product.images?.[0]?.url) ||
                          "/placeholder.svg"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                          {product.category?.name || "Featured"}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg text-primary">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">Buy</p>
                          <p className="font-bold text-foreground">
                            {formatCurrency(
                              product.onSale && product.salePrice
                                ? product.salePrice
                                : product.price
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Rent</p>
                          <p className="font-bold text-accent">
                            {/* if rent price exists */}
                            {(product as any) && (product as any).rentPrice
                              ? `${formatCurrency(
                                  (product as any).rentPrice
                                )}/day`
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/products">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 bg-transparent"
                >
                  View All Products
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">
              Experience Moroccan Craftsmanship
            </h2>
            <p className="text-xl leading-relaxed opacity-90">
              Each caftan tells a story of tradition, artistry, and timeless
              elegance passed down through generations
            </p>
            <Link href="/about">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8"
              >
                Learn Our Story
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
