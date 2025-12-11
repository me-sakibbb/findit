import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { PublicProfileView } from "@/components/public-profile-view"
import { ProfileEditModal } from "@/components/profile-edit-modal"

interface ProfilePageProps {
  searchParams: Promise<{
    id?: string
  }>
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const params = await searchParams
  const profileId = params.id

  // Viewing someone else's profile
  if (profileId) {
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", profileId).single()

    if (error || !profile) {
      redirect("/profile?error=User not found")
    }

    // Fetch all items for this user
    const { data: items } = await supabase
      .from("items")
      .select("*, profiles(full_name, avatar_url)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    const allItems = items || []
    
    // Calculate statistics
    const stats = {
      totalItems: allItems.length,
      activeItems: allItems.filter((item) => item.is_active).length,
      resolvedItems: allItems.filter((item) => !item.is_active).length,
      lostItems: allItems.filter((item) => item.status === "lost").length,
      foundItems: allItems.filter((item) => item.status === "found").length,
    }

    // Calculate recent activity
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const itemsThisMonth = allItems.filter(
      (item) => new Date(item.created_at) >= thisMonthStart
    ).length

    const recentActivity = {
      lastActive: allItems.length > 0 ? allItems[0].created_at : profile.created_at,
      itemsThisMonth,
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <PublicProfileView 
          profile={profile} 
          currentUserId={user?.id}
          items={allItems}
          stats={stats}
          recentActivity={recentActivity}
        />
      </div>
    )
  }

  // Viewing own profile
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch all items for the current user
  const { data: items } = await supabase
    .from("items")
    .select("*, profiles(full_name, avatar_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const allItems = items || []
  
  // Calculate statistics
  const stats = {
    totalItems: allItems.length,
    activeItems: allItems.filter((item) => item.is_active).length,
    resolvedItems: allItems.filter((item) => !item.is_active).length,
    lostItems: allItems.filter((item) => item.status === "lost").length,
    foundItems: allItems.filter((item) => item.status === "found").length,
  }

  // Calculate recent activity
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const itemsThisMonth = allItems.filter(
    (item) => new Date(item.created_at) >= thisMonthStart
  ).length

  const recentActivity = {
    lastActive: allItems.length > 0 ? allItems[0].created_at : profile?.created_at,
    itemsThisMonth,
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <PublicProfileView 
        profile={profile} 
        currentUserId={user.id}
        items={allItems}
        stats={stats}
        recentActivity={recentActivity}
        editButton={<ProfileEditModal profile={profile} />}
      />
    </div>
  )
}
