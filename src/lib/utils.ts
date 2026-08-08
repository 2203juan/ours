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

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Format a COP budget amount using Colombian conventions ("$ 150.000"). */
export function formatBudget(amount: number | null | undefined): string {
  if (amount == null) return ''
  return copFormatter.format(amount)
}

/** Group digits with Colombian thousand separators — for live input formatting. */
export function formatBudgetDigits(digits: string): string {
  if (!digits) return ''
  return Number(digits).toLocaleString('es-CO')
}

/** Returns true if a category name/emoji suggests it's food/restaurant related. */
export function isFoodCategory(name: string, emoji: string): boolean {
  const foodEmojis = ['🍽️', '🍕', '🍣', '🥂', '🍹', '🍸', '🍔', '🥗', '☕', '🍜', '🍱', '🥩', '🍷']
  const foodKeywords = ['food', 'restaurant', 'cafe', 'bar', 'eat', 'drink', 'date', 'dinner', 'lunch', 'brunch']
  if (foodEmojis.includes(emoji)) return true
  const lower = name.toLowerCase()
  return foodKeywords.some((kw) => lower.includes(kw))
}

/** Colombian formatting throughout — the app's users and its currency are. */
export const LOCALE = 'es-CO'

/** Parse a YYYY-MM-DD date as local time, not UTC (`new Date(str)` shifts a day). */
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Format a date string (YYYY-MM-DD) to a readable form. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return parseDateOnly(dateStr).toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Short form for dense rows: "12 mar". */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return parseDateOnly(dateStr).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
}

/** "marzo de 2026" — the heading for a month group in Memories. */
export function formatMonth(date: Date): string {
  return date.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
}

/** Whole days from today to a YYYY-MM-DD date. Negative means overdue. */
export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = parseDateOnly(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** "Today" / "Tomorrow" / "In 4 days" / "3 days ago" for dated plans. */
export function relativeDay(dateStr: string): string {
  const days = daysUntil(dateStr)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days < 0) return `${Math.abs(days)} days ago`
  if (days < 7) return `In ${days} days`
  return formatDateShort(dateStr)
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

/**
 * Drop focus from whatever field currently has it.
 *
 * Call before unmounting a focused input on iOS: if the field disappears from
 * the DOM while focused, Safari leaves the page stuck at the zoom level it
 * animated to, with no way back short of reloading.
 */
export function blurActiveField() {
  const el = document.activeElement
  if (el instanceof HTMLElement) el.blur()
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
