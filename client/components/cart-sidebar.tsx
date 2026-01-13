'use client'

import React, { useEffect, useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { getPublicSettings } from '@/lib/api/settings'

export const CartSidebar: React.FC = () => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart, isOpen, toggleCart } = useCart()
  const [currency, setCurrency] = useState<string>('MAD')
  const [storePhone, setStorePhone] = useState<string>('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const settings = await getPublicSettings()
        if (mounted) {
          if (settings.currency) setCurrency(settings.currency)
          if (settings.storePhone) setStorePhone(settings.storePhone)
        }
      } catch (err) {
        // Keep default MAD on error
        console.warn('Failed to load settings currency, defaulting to MAD')
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleCheckout = () => {
    if (items.length === 0) return
    const phone = (storePhone || '').replace(/\D/g, '')
    if (!phone) {
      alert('Store phone number is not configured.')
      return
    }
    const lines = items.map(item => {
      const unit = item.type === 'rent' && item.rentPrice ? item.rentPrice : item.price
      const lineTotal = unit * item.quantity
      const sizeStr = item.size ? ` (Size ${item.size})` : ''
      return `• ${item.name}${sizeStr} x${item.quantity} — ${formatCurrency(lineTotal, currency)}`
    })
    const message = [
      'Hello! I would like to order:',
      ...lines,
      `Total: ${formatCurrency(totalPrice, currency)}`,
    ].join('\n')
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
        onClick={toggleCart}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalItems}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={toggleCart}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-4">Add some items to get started</p>
              <Button asChild onClick={toggleCart}>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={item.type === 'rent' ? 'outline' : 'secondary'} className="text-xs">
                              {item.type === 'rent' ? 'Rent' : 'Buy'}
                            </Badge>
                            {item.size && (
                              <span className="text-xs text-muted-foreground">Size: {item.size}</span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-primary mt-2">
                            {formatCurrency(item.type === 'rent' && item.rentPrice ? item.rentPrice : item.price, currency)}
                            {item.type === 'rent' && item.rentDuration && (
                              <span className="text-xs text-muted-foreground ml-1">
                                /{item.rentDuration} days
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm font-medium">
                          Total: {formatCurrency((item.type === 'rent' && item.rentPrice ? item.rentPrice : item.price) * item.quantity, currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Clear Cart Button */}
              {items.length > 1 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCart}
                  className="w-full text-muted-foreground"
                >
                  Clear Cart
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-6 space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(totalPrice, currency)}</span>
            </div>
            <div className="space-y-2">
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/products" onClick={toggleCart}>
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}