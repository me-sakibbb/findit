import { createServerClient } from "@/lib/supabase/server"
import { SearchFilters } from "@/components/search-filters"
import { ItemCard } from "@/components/item-card"
import { PaginatedItemList } from "@/components/paginated-item-list"

import { Package } from "lucide-react"

interface SearchPageProps {
  searchParams: Promise<{
    type?: string
    category?: string
    q?: string
    locationName?: string
    lat?: string
    lng?: string
    radius?: string
    userId?: string
    dateFrom?: string
    dateTo?: string
  }>
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from("items")
    .select("*, profiles(id, full_name, avatar_url)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Apply filters
  if (params.type && params.type !== "all") {
    query = query.eq("status", params.type)
  }
  if (params.category && params.category !== "all") {
    // Since items.category stores the Name (e.g. "Electronics") but the URL param is the Slug (e.g. "electronics"),
    // we need to find the category name from the slug first.
    // Ideally, we should join tables, but for now let's fetch the category name.
    const { data: categoryData } = await supabase
      .from("categories")
      .select("name")
      .eq("slug", params.category)
      .single()

    if (categoryData) {
      query = query.eq("category", categoryData.name)
    } else {
      // Fallback: try to filter by the slug directly if it happens to match (unlikely but safe)
      // or just filter by what was passed if it's not found (might return nothing, which is correct)
      query = query.eq("category", params.category)
    }
  }
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  }
  if (params.userId) {
    query = query.eq("user_id", params.userId)
  }
  if (params.dateFrom) {
    query = query.gte("created_at", params.dateFrom)
  }
  if (params.dateTo) {
    query = query.lte("created_at", params.dateTo)
  }

  const { data: items, error } = await query

  if (error) {
    console.error("[v0] Error fetching items:", error)
  }

  let filteredItems = items || []

  if (params.lat && params.lng && params.radius && filteredItems.length > 0) {
    const searchLat = Number.parseFloat(params.lat)
    const searchLng = Number.parseFloat(params.lng)
    const radiusKm = Number.parseFloat(params.radius)

    filteredItems = filteredItems.filter((item) => {
      if (!item.latitude || !item.longitude) return false

      const distance = calculateDistance(searchLat, searchLng, item.latitude, item.longitude)
      return distance <= radiusKm
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Search Lost & Found Items</h1>
        <p className="text-lg text-muted-foreground">Browse through reported lost and found items in your area</p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-8">
        <aside>
          <SearchFilters />
        </aside>

        <div>
          <PaginatedItemList
            initialItems={filteredItems as any[]}
            filters={{
              status: params.type as any,
              category: params.category,
              search: params.q,
              userId: params.userId
            }}
          />
        </div>
      </div>
    </div>
  )
}
