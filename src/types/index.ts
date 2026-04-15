// =====================================================
// Domain types – mirrors the Supabase schema (v2)
// =====================================================

export type PartnerKey = 'one' | 'two'

export interface Couple {
  id: string
  code: string
  couple_name: string | null
  partner_one_name: string
  partner_two_name: string
  partner_one_avatar: AvatarKey
  partner_two_avatar: AvatarKey
  created_at: string
}

export interface Category {
  id: string
  couple_id: string
  name: string
  emoji: string
  sort_order: number
  created_at: string
}

export type PlanStatus = 'to_do' | 'done'
export type PlanPriority = 'low' | 'normal' | 'high'

export interface Plan {
  id: string
  couple_id: string
  category_id: string | null
  /** 'one' | 'two' | null  (null for plans migrated from v1) */
  proposed_by: string | null
  name: string
  description: string | null
  status: PlanStatus
  priority: PlanPriority
  budget_estimate: number | null
  location_text: string | null
  maps_url: string | null
  instagram_ref: string | null
  tiktok_url: string | null
  menu_url: string | null
  completion_note: string | null
  ideal_date: string | null
  is_someday: boolean
  images: string[]
  created_at: string
  updated_at: string
  // joined relation
  category?: Category
}

// =====================================================
// Avatar preset system
// =====================================================

export const AVATAR_PRESETS = [
  { key: 'blossom', label: 'Blossom', colors: ['#EDD2D6', '#C98A94'] },
  { key: 'sage',    label: 'Sage',    colors: ['#AABFB2', '#427358'] },
  { key: 'sand',    label: 'Sand',    colors: ['#D4BB9A', '#8C6D43'] },
  { key: 'dusk',    label: 'Dusk',    colors: ['#C4B5D5', '#8B6FAE'] },
  { key: 'sky',     label: 'Sky',     colors: ['#A8C5D8', '#4A7A9B'] },
  { key: 'ember',   label: 'Ember',   colors: ['#E8C09A', '#C4714A'] },
] as const

export type AvatarKey = typeof AVATAR_PRESETS[number]['key']

export function getAvatarPreset(key: string) {
  return AVATAR_PRESETS.find((p) => p.key === key) ?? AVATAR_PRESETS[0]
}

// =====================================================
// App session – stored in localStorage (key: ours-session-v2)
// =====================================================

export interface Session {
  coupleId: string
  coupleCode: string
  coupleName: string
  partnerOneName: string
  partnerOneAvatar: AvatarKey
  partnerTwoName: string
  partnerTwoAvatar: AvatarKey
  /** Which partner this device has identified as. null = not yet chosen. */
  partnerKey: PartnerKey | null
}

/** Derived helpers used throughout the app */
export function getMyName(session: Session): string {
  return session.partnerKey === 'one' ? session.partnerOneName : session.partnerTwoName
}

export function getMyAvatar(session: Session): AvatarKey {
  return session.partnerKey === 'one' ? session.partnerOneAvatar : session.partnerTwoAvatar
}

export function getPartnerName(session: Session, key: 'one' | 'two'): string {
  return key === 'one' ? session.partnerOneName : session.partnerTwoName
}

export function getPartnerAvatar(session: Session, key: 'one' | 'two'): AvatarKey {
  return key === 'one' ? session.partnerOneAvatar : session.partnerTwoAvatar
}

// =====================================================
// Filter state
// =====================================================

export interface PlanFilters {
  categoryId: string | 'all'
  proposedBy: PartnerKey | 'all'
}

// =====================================================
// Form payloads
// =====================================================

export interface CreatePlanPayload {
  couple_id: string
  category_id: string | null
  proposed_by: PartnerKey
  name: string
  description?: string | null
  priority: PlanPriority
  budget_estimate?: number | null
  location_text?: string | null
  maps_url?: string | null
  instagram_ref?: string | null
  tiktok_url?: string | null
  menu_url?: string | null
  ideal_date?: string | null
  is_someday: boolean
  images: string[]
}

export interface UpdatePlanPayload {
  category_id?: string | null
  name?: string
  description?: string | null
  status?: PlanStatus
  priority?: PlanPriority
  budget_estimate?: number | null
  location_text?: string | null
  maps_url?: string | null
  instagram_ref?: string | null
  tiktok_url?: string | null
  menu_url?: string | null
  completion_note?: string | null
  ideal_date?: string | null
  is_someday?: boolean
  images?: string[]
}

// =====================================================
// Default categories seed data
// =====================================================

export const DEFAULT_CATEGORIES: Array<{ name: string; emoji: string; sort_order: number }> = [
  { name: 'Dates / Food', emoji: '🍽️', sort_order: 0 },
  { name: 'Travel', emoji: '✈️', sort_order: 1 },
  { name: 'At Home', emoji: '🏠', sort_order: 2 },
  { name: 'New Experiences', emoji: '✨', sort_order: 3 },
  { name: 'Wellness', emoji: '🌿', sort_order: 4 },
  { name: 'Low Budget', emoji: '💚', sort_order: 5 },
  { name: 'Romantic', emoji: '🌹', sort_order: 6 },
  { name: 'Adventures', emoji: '🏕️', sort_order: 7 },
]

// =====================================================
// Activity feed
// =====================================================

export type ActivityType = 'plan_created'

export interface Activity {
  id: string
  couple_id: string
  type: ActivityType
  actor_name: string
  /** null when the referenced plan has been deleted */
  plan_id: string | null
  plan_name: string
  created_at: string
}

// =====================================================
// Status / priority label maps
// =====================================================

export const STATUS_LABELS: Record<PlanStatus, string> = {
  to_do: 'To do',
  done: 'Done',
}

export const PRIORITY_LABELS: Record<PlanPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}
