import type React from "react";
import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CartSidebar } from "@/components/cart-sidebar";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Aguizoul Caftan - Moroccan Luxury Caftans",
  description:
    "Rent or buy exquisite Moroccan caftans. Discover traditional craftsmanship meets modern elegance.",
  generator: "Next.js",
  applicationName: "Aguizoul Caftan",
  referrer: "origin-when-cross-origin",
  icons: {
    icon: [
      {
        url: "caftan.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "caftan.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "caftan.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning used to avoid console spam from browser extensions or client-only attributes that modify <body> */}
      <body
        suppressHydrationWarning
        className={`${playfairDisplay.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            {children}
            <CartSidebar />
          </CartProvider>
        </AuthProvider>
        {/* Only enable Vercel Analytics in production to avoid dev console noise */}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
