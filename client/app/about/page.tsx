import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Users, Award, Globe } from "lucide-react"

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Heritage & Tradition",
      description: "Preserving centuries-old Moroccan craftsmanship and passing it to future generations",
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Supporting local artisans and their families throughout Morocco",
    },
    {
      icon: Award,
      title: "Quality Excellence",
      description: "Using only the finest fabrics and maintaining highest quality standards",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Sharing Moroccan culture and elegance with the world",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">Our Story</h1>
            <p className="text-xl leading-relaxed opacity-90">A journey of passion, heritage, and timeless elegance</p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg leading-relaxed text-foreground">
                Aguizoul Caftan was born from a deep love for Moroccan heritage and a vision to share the beauty of
                traditional caftans with the world. For generations, Moroccan artisans have perfected the art of
                caftan-making, weaving stories of culture, celebration, and craftsmanship into every thread.
              </p>
              <p className="text-lg leading-relaxed text-foreground mt-6">
                Our founder grew up surrounded by the vibrant colors, intricate embroidery, and flowing fabrics of
                traditional Moroccan celebrations. Inspired by the elegance worn by generations of women in her family,
                she set out to create a platform that would make these exquisite pieces accessible to everyone—whether
                for a special occasion or to own a piece of Moroccan artistry forever.
              </p>
              <p className="text-lg leading-relaxed text-foreground mt-6">
                Today, we work directly with skilled artisans across Morocco, ensuring fair compensation and preserving
                traditional techniques. Each caftan in our collection is handcrafted with meticulous attention to
                detail, using luxurious fabrics and time-honored embroidery methods passed down through generations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-12">
              <div className="relative h-80 rounded-xl overflow-hidden">
                <img
                  src="/moroccan-artisan-embroidery-traditional.jpg"
                  alt="Moroccan artisan at work"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative h-80 rounded-xl overflow-hidden">
                <img
                  src="/moroccan-caftan-workshop-craftsmanship.jpg"
                  alt="Caftan craftsmanship"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-primary">Our Values</h2>
              <p className="text-xl text-muted-foreground">What drives us forward every day</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value) => {
                const Icon = value.icon
                return (
                  <Card key={value.title} className="border-2 border-border hover:border-accent transition-colors">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20">
                        <Icon className="h-8 w-8 text-accent" />
                      </div>
                      <h3 className="text-xl font-semibold text-primary">{value.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">Our Mission</h2>
            <p className="text-xl leading-relaxed opacity-90">
              To celebrate and preserve Moroccan craftsmanship while making luxury caftans accessible to everyone,
              whether through rental for special occasions or purchase for lifelong treasures. We believe in sustainable
              fashion, fair trade practices, and sharing the beauty of our culture with the world.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
