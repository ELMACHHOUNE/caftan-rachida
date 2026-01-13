"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 border border-border rounded-lg bg-card shadow-sm">
        <h1 className="text-2xl font-bold text-red-600 mb-3">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this area.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="default" onClick={() => router.push('/')}>Return Home</Button>
          <Button variant="outline" onClick={() => router.push('/login')}>Sign In</Button>
        </div>
      </div>
    </div>
  )
}
