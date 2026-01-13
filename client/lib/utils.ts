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
 * If the URL is relative (starts with /uploads), prefix it with NEXT_PUBLIC_API_URL or fallback to http://localhost:5000
 */
export function normalizeImageUrl(url?: string | null) {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads')) {
    const base = (process.env.NEXT_PUBLIC_API_URL as string) || 'http://localhost:5000'
    return `${base}${url}`
  }
  return url
}
