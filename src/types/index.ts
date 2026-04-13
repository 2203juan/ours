// =====================================================
// Domain types – mirrors the Supabase schema exactly
// =====================================================

export interface Couple {
  id: string
  code: string
  couple_name: string | null
  created_at: string
}

export interface Profile {
  id: string
  couple_id: string
  name: string
  avatar_url: string | null
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

export type PlanStatus = 'pending' | 'selected' | 'completed' | 'canceled'
export type PlanPriority = 'low' | 'normal' | 'high'

export interface Plan {
  id: string
  couple_id: string
  category_id: string | null
  proposed_by: string | null
  name: string
  description: string | null
  status: PlanStatus
  priority: PlanPriority
  budget_estimate: number | null
  location_text: string | null
  maps_url: string | null
  instagram_ref: string | null
  ideal_date: string | null
  is_someday: boolean
  images: string[]
  created_at: string
  updated_at: string
  // joined relations (populated client-side)
  category?: Category
  proposer?: Profile
}

// =====================================================
// App session – stored in localStorage
// =====================================================

export interface Session {
  coupleId: string
  coupleCode: string
  coupleName: string
  profileId: string
  profileName: string
  avatarUrl: string | null
}

// =====================================================
// Filter state
// =====================================================

export interface PlanFilters {
  status: PlanStatus | 'all'
  categoryId: string | 'all'
  proposedBy: string | 'all'
}

// =====================================================
// Form payloads
// =====================================================

export interface CreatePlanPayload {
  couple_id: string
  category_id: string | null
  proposed_by: string
  name: string
  description?: string | null
  priority: PlanPriority
  budget_estimate?: number | null
  location_text?: string | null
  maps_url?: string | null
  instagram_ref?: string | null
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
// Status / priority label maps
// =====================================================

export const STATUS_LABELS: Record<PlanStatus, string> = {
  pending: 'Pending',
  selected: 'Selected',
  completed: 'Done',
  canceled: 'Canceled',
}

export const PRIORITY_LABELS: Record<PlanPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}
