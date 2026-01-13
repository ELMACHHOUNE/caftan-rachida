import Link from "next/link"
import { Instagram, Facebook, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Aguizoul Caftan</h3>
            <p className="text-sm leading-relaxed opacity-90">
              Discover the beauty of Moroccan heritage through our exquisite collection of traditional and modern
              caftans.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:opacity-70 transition-opacity">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:opacity-70 transition-opacity">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:opacity-70 transition-opacity">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:opacity-70 transition-opacity">
                  Shop
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/categories?filter=rent" className="hover:opacity-70 transition-opacity">
                  Rent Caftans
                </Link>
              </li>
              <li>
                <Link href="/categories?filter=buy" className="hover:opacity-70 transition-opacity">
                  Buy Caftans
                </Link>
              </li>
              <li>
                <Link href="/categories?filter=wedding" className="hover:opacity-70 transition-opacity">
                  Wedding Collection
                </Link>
              </li>
              <li>
                <Link href="/categories?filter=luxury" className="hover:opacity-70 transition-opacity">
                  Luxury Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="font-semibold mb-4">Connect With Us</h4>
            <ul className="space-y-2 text-sm mb-4">
              <li>Email: business.aguizoul@gmail.com</li>
              <li>Phone: +212652901122</li>
              <li>Guelmim, Morocco</li>
            </ul>
            <div className="flex gap-4">
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-75">
          <p>&copy; {new Date().getFullYear()} Aguizoul Caftan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
