import { createServerClient } from "@/lib/supabase/server"
import { SearchFilters } from "@/components/search-filters"
import { ItemCard } from "@/components/item-card"

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
    query = query.eq("category", params.category)
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
          {filteredItems && filteredItems.length > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredItems.length}</span> item(s)
                </p>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground max-w-md">
                No items matched your search criteria. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
