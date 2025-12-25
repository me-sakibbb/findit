import { createClient } from "@/lib/supabase/server"
import { UsersTable } from "@/components/admin/users-table"

export default async function AdminUsersPage() {
    const supabase = await createClient()

    const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Users</h1>
            </div>
            <UsersTable users={profiles || []} />
        </div>
    )
}
