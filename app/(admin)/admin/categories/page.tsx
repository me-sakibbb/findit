import { createClient } from "@/lib/supabase/server"
import { CategoriesTable } from "@/components/admin/categories-table"

export default async function AdminCategoriesPage() {
    const supabase = await createClient()

    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Categories</h1>
            </div>
            <CategoriesTable categories={categories || []} />
        </div>
    )
}
