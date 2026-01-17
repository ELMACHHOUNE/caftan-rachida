import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'MAD', locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

/**
 * Normalize image URL returned from the API.
 * If the URL is relative (starts with /uploads), prefix it with the server *origin*.
 * Note: NEXT_PUBLIC_API_URL usually points to the API root (e.g. https://domain.com/api),
 * but uploads are served from https://domain.com/uploads (no /api).
 */
export function normalizeImageUrl(url?: string | null) {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const apiBase = (process.env.NEXT_PUBLIC_API_URL as string) || 'http://localhost:5000/api'
  const apiRoot = apiBase.replace(/\/+$/, '')
  const origin = apiRoot.replace(/\/api$/, '')

  // If API returns a relative uploads path, make it absolute.
  // Uploads are served from /uploads (without /api/ prefix).
  if (url.startsWith('/api/uploads')) {
    // Remove /api prefix from the URL
    return `${origin}${url.replace('/api', '')}`
  }
  if (url.startsWith('/uploads')) {
    // Directly use /uploads path (without /api/ prefix)
    return `${origin}${url}`
  }
  return url
}
