import { createServerClient } from "@/lib/supabase/server"
import { PeopleSearch } from "@/components/people-search"

interface PeoplePageProps {
  searchParams: Promise<{
    query?: string
    city?: string
    state?: string
    verified?: string
  }>
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const supabase = await createServerClient()
  const params = await searchParams

  // Build query
  let query = supabase
    .from("profiles")
    .select(`
      *,
      items(count)
    `)
    .order("created_at", { ascending: false })

  // Apply filters
  if (params.query) {
    query = query.ilike("full_name", `%${params.query}%`)
  }

  if (params.city) {
    query = query.ilike("city", `%${params.city}%`)
  }

  if (params.state) {
    query = query.ilike("state", `%${params.state}%`)
  }

  const { data: profiles } = await query

  // For each profile, get their item statistics
  const profilesWithStats = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { data: items } = await supabase
        .from("items")
        .select("id, status, is_active")
        .eq("user_id", profile.id)

      const stats = {
        totalItems: items?.length || 0,
        activeItems: items?.filter((item) => item.is_active).length || 0,
        resolvedItems: items?.filter((item) => !item.is_active).length || 0,
        lostItems: items?.filter((item) => item.status === "lost").length || 0,
        foundItems: items?.filter((item) => item.status === "found").length || 0,
      }

      return {
        ...profile,
        stats,
      }
    })
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find People</h1>
        <p className="text-muted-foreground">
          Connect with community members who can help you find lost items or have found items to return
        </p>
      </div>

      <PeopleSearch 
        profiles={profilesWithStats}
        initialFilters={{
          query: params.query || "",
          city: params.city || "",
          state: params.state || "",
        }}
      />
    </div>
  )
}
