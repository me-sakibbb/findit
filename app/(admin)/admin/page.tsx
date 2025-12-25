import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { Users, Package, FileText, CheckCircle } from "lucide-react"

export default async function AdminDashboard() {
    const supabase = await createClient()

    const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })

    const { count: itemsCount } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true })

    const { count: claimsCount } = await supabase
        .from("claims")
        .select("*", { count: "exact", head: true })

    const { count: resolvedCount } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .not("resolved_at", "is", null)

    const stats = [
        {
            title: "Total Users",
            value: usersCount || 0,
            icon: Users,
            description: "Registered users",
        },
        {
            title: "Total Items",
            value: itemsCount || 0,
            icon: Package,
            description: "Lost and found items",
        },
        {
            title: "Total Claims",
            value: claimsCount || 0,
            icon: FileText,
            description: "Claims submitted",
        },
        {
            title: "Resolved Items",
            value: resolvedCount || 0,
            icon: CheckCircle,
            description: "Successfully returned",
        },
    ]

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
