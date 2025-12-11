import { createServerClient } from "@/lib/supabase/server"
import { SearchFilters } from "@/components/search-filters"
import { ItemCard } from "@/components/item-card"
import { Package } from "lucide-react"

export default async function ItemsPage() {
  const supabase = await createServerClient()

  const { data: items, error } = await supabase
    .from("items")
    .select("*, profiles(id, full_name, avatar_url)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[Items] Error fetching items:", error)
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">All Items</h1>
        <p className="text-lg text-muted-foreground">Browse through all reported lost and found items</p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-8">
        <aside>
          <SearchFilters />
        </aside>

        <div>
          {items && items.length > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{items.length}</span> item(s)
                </p>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((item) => (
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
                No items have been posted yet. Be the first to post a lost or found item!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
