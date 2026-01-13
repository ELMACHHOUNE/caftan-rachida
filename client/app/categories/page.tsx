export const dynamic = "force-dynamic";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCategoriesWithCounts } from "@/lib/api/categories";

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof getCategoriesWithCounts>> = [];
  try {
    categories = await getCategoriesWithCounts();
  } catch (e) {
    categories = [];
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-linear-to-br from-primary via-secondary to-accent text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">
              Browse Categories
            </h1>
            <p className="text-xl leading-relaxed opacity-90">
              Explore our curated collections of authentic Moroccan caftans
            </p>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category) => (
                <Card
                  key={category._id}
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-border hover:border-accent"
                >
                  <div className="relative h-64 overflow-hidden bg-muted">
                    <img
                      src={category.image?.url || "/placeholder.svg"}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-primary/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
                      <h3 className="text-2xl font-bold mb-2">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm opacity-90">
                          {category.description}
                        </p>
                      )}
                      {typeof category.productCount === "number" && (
                        <p className="text-xs opacity-80 mt-1">
                          {category.productCount} products
                        </p>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <Link
                      href={
                        category._id.startsWith("fallback:")
                          ? `/products?search=${encodeURIComponent(
                              category.name
                            )}`
                          : `/products?category=${category._id}`
                      }
                    >
                      <Button className="w-full">Explore Collection</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-primary text-balance">
              {"Can't find what you're looking for?"}
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Contact us for custom orders and personalized recommendations
            </p>
            <Link href="/contact">
              <Button size="lg" className="text-lg px-8">
                Get in Touch
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
