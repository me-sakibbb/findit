import { createClient } from "@/lib/supabase/server"
import { ItemsTable } from "@/components/admin/items-table"

export default async function AdminItemsPage() {
    const supabase = await createClient()

    const { data: items } = await supabase
        .from("items")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Items</h1>
            </div>
            <ItemsTable items={items || []} />
        </div>
    )
}
