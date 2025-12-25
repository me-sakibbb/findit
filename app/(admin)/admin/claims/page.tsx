import { createClient } from "@/lib/supabase/server"
import { ClaimsTable } from "@/components/admin/claims-table"

export default async function AdminClaimsPage() {
  const supabase = await createClient()

  const { data: claims } = await supabase
    .from("claims")
    .select(`
      *,
      items (
        title,
        status
      ),
      profiles:claimant_id (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Claims</h1>
      </div>
      <ClaimsTable claims={claims || []} />
    </div>
  )
}
