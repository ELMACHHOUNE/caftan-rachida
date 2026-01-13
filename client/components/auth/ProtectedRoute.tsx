'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

// Email-based admin whitelist (in addition to role)
const ADMIN_WHITELIST = new Set<string>(['business.aguizoul@gmail.com'])

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
  redirectTo?: string // where to send unauthenticated users
}

// Unified protected route with role-based guard
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  redirectTo = '/login',
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const isAdminUser = !!user && (user.role === 'admin' || (user.email?.toLowerCase && ADMIN_WHITELIST.has(user.email.toLowerCase())))

  useEffect(() => {
    if (isLoading) return // Wait for auth to initialize

    // Not logged in → go to login
    if (!isAuthenticated) {
      router.push(redirectTo)
      return
    }

    // Logged in but not admin when required → go to unauthorized page
    if (requireAdmin && !isAdminUser) {
      router.push('/unauthorized')
      return
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, redirectTo, router])

  // Loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Block rendering if not allowed
  if (!isAuthenticated) return null
  if (requireAdmin && !isAdminUser) return null

  return <>{children}</>
}

// Backward-compatible AdminRoute wrapper (no email whitelist)
interface AdminRouteProps {
  children: ReactNode
  redirectTo?: string // unused; admin unauthorized goes to /unauthorized
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  return <ProtectedRoute requireAdmin>{children}</ProtectedRoute>
}

interface PublicRouteProps {
  children: ReactNode
  redirectTo?: string
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = '/',
}) => {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAuthenticated) return null
  return <>{children}</>
}