export type ItemStatus = "lost" | "found"

export type ItemCategory = "electronics" | "accessories" | "documents" | "keys" | "bags" | "clothing" | "pets" | "other"

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  display_name: string | null
  phone: string | null
  avatar_url: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  preferred_contact: "email" | "phone" | "both" | null
  notification_preferences: {
    email: boolean
    push: boolean
  } | null
  is_onboarded: boolean
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  status: ItemStatus
  location: string
  date: string
  image_url: string | null
  is_active: boolean
  ai_tags: string[] | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  item_id: string | null
  content: string
  is_read: boolean
  created_at: string
}

export interface PotentialMatch {
  id: string
  lost_item_id: string
  found_item_id: string
  match_score: number
  created_at: string
}
