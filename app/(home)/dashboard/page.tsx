import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { DashboardItemCard } from "@/components/dashboard-item-card"
import { PotentialMatchCard } from "@/components/potential-match-card"

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's items
  const { data: items, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching items:", error)
  }

  const activeItems = items?.filter((item) => item.status === "active") || []
  const resolvedItems = items?.filter((item) => item.status === "resolved") || []

  // Fetch potential matches for user's items in parallel
  const itemIds = items?.map((i) => i.id) || []
  const matchesPromise = itemIds.length > 0
    ? supabase
        .from("potential_matches")
        .select(
          "*, item:items!potential_matches_item_id_fkey(*), matched_item:items!potential_matches_matched_item_id_fkey(*, profiles(*))",
        )
        .in("item_id", itemIds)
        .order("confidence_score", { ascending: false })
    : Promise.resolve({ data: null })

  const { data: matches } = await matchesPromise

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your lost and found items</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/post/lost">
              <Plus className="mr-2 h-4 w-4" />
              Post Lost Item
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/post/found">
              <Plus className="mr-2 h-4 w-4" />
              Post Found Item
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active ({activeItems.length})</TabsTrigger>
          <TabsTrigger value="matches">Potential Matches ({matches?.length || 0})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeItems.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-card">
              <p className="text-muted-foreground mb-4">You haven't posted any items yet</p>
              <Button asChild>
                <Link href="/post/lost">Post Your First Item</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeItems.map((item) => (
                <DashboardItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          {!matches || matches.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-card">
              <p className="text-muted-foreground mb-4">No potential matches found for your items.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <PotentialMatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedItems.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-card">
              <p className="text-muted-foreground mb-4">You have no resolved items.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resolvedItems.map((item) => (
                <DashboardItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
