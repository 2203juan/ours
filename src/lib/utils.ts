type ClassValue = string | number | boolean | undefined | null

// Lightweight cn() helper – no extra dependency
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Generate a random 6-character alphanumeric code (uppercase). */
export function generateCoupleCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Normalize a pasted social media value into a full https:// URL.
 * Handles: full URLs, bare domains, @usernames, bare usernames.
 */
export function normalizeSocialUrl(raw: string, platform: 'instagram' | 'tiktok'): string {
  const s = raw.trim()
  if (!s) return ''
  if (s.startsWith('https://')) return s
  if (s.startsWith('http://')) return s.replace('http://', 'https://')
  // Strip leading @ to get the handle
  const handle = s.startsWith('@') ? s.slice(1) : s
  // Already has a domain component — just prepend protocol
  if (handle.includes('.')) return 'https://' + handle
  // Bare username — build canonical URL
  if (platform === 'instagram') return `https://www.instagram.com/${handle}/`
  return `https://www.tiktok.com/@${handle}`
}

/** Strip spaces/dashes and uppercase — normalizes raw user input into a code. */
export function normalizeCode(raw: string): string {
  return raw.replace(/[\s\-]/g, '').toUpperCase()
}

/** Returns an error string if the code format is invalid, otherwise null. */
export function validateCodeFormat(code: string): string | null {
  if (code.length < 4) return 'Code must be at least 4 characters.'
  if (code.length > 12) return 'Code must be 12 characters or fewer.'
  if (!/^[A-Z0-9]+$/.test(code)) return 'Only letters and numbers are allowed.'
  return null
}

/** Format a currency amount with a fallback. */
export function formatBudget(amount: number | null | undefined): string {
  if (amount == null) return ''
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format a date string (YYYY-MM-DD) to a readable form. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Pick a random item from an array. Returns undefined for empty arrays. */
export function pickRandom<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Truncate text with ellipsis. */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '…'
}

/** Get initials from a name. */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
