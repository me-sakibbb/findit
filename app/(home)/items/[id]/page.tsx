import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MapPin, MessageSquare, Tag, Clock, Share2, Flag, ArrowLeft, ShieldCheck, Printer, Download } from "lucide-react"
import Link from "next/link"
import { ItemDetailClient } from "./item-detail-client"
import { ItemCard } from "@/components/item-card"
import { MapWrapper } from "@/components/map-wrapper"
import { ItemComments } from "@/components/item-comments"
import { Separator } from "@/components/ui/separator"
import { PotentialMatches } from "@/components/potential-matches"
import { UserTrustBadge } from "@/components/user-trust-badge"

interface ItemDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: item, error } = await supabase.from("items").select("*").eq("id", id).single()

  if (error || !item) {
    console.log("[ItemDetail] Item fetch error:", error)
    notFound()
  }

  // Fetch profile
  let profile = null
  if (item.user_id) {
    const { data } = await supabase.from("profiles").select("full_name, avatar_url, trust_score").eq("id", item.user_id).single()
    profile = data
  }

  // Fetch current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === item.user_id

  // Fetch questions for claim verification
  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, correct_answer")
    .eq("item_id", id)

  // Fetch claims if user is owner
  let claims: any[] = []
  if (isOwner) {
    const { data: claimsData } = await supabase
      .from("claims")
      .select("*, claimant:profiles(full_name, email)")
      .eq("item_id", id)
      .order("created_at", { ascending: false })
    claims = claimsData || []
  }

  // Fetch similar items
  const { data: similarItems } = await supabase
    .from("items")
    .select("*, profiles(full_name, avatar_url)")
    .neq("id", id)
    .eq("status", item.status)
    .limit(3)

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "?"

  return (
    <div className="min-h-svh bg-background pb-20">
      {/* Navigation Bar Placeholder */}
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </Button>
      </div>

      <main className="container mx-auto px-4 max-w-6xl">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{item.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Badge
              variant={item.status === "lost" ? "destructive" : "default"}
              className="px-3 py-1 text-sm font-medium"
            >
              {item.status === "lost" ? "Lost Item" : "Found Item"}
            </Badge>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {item.city && item.state ? `${item.city}, ${item.state}` : item.location || "Location not specified"}
            </span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Posted {new Date(item.created_at).toLocaleDateString()}
            </span>
            {item.reward_amount && (
              <>
                <span className="hidden md:inline">•</span>
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-none text-sm px-3 py-1">
                  Reward: {item.currency === 'BDT' ? '৳' : '$'}{item.reward_amount}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Potential Matches - High Visibility */}
        <PotentialMatches
          itemId={item.id}
          itemStatus={item.status}
          currentUserId={user?.id}
          itemOwnerId={item.user_id}
        />

        {/* Hero Image */}
        <div className="relative aspect-video md:aspect-[21/9] w-full overflow-hidden rounded-2xl border bg-muted shadow-sm mb-10">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/50">
              <img
                src="/placeholder.svg?height=600&width=1200"
                alt={item.title}
                className="opacity-30"
              />
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-12">

          {/* Left Column: Details */}
          <div className="space-y-10">

            {/* Posted By */}
            <div className="flex items-center justify-between pb-8 border-b">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">Posted by {profile?.full_name || "FindIt User"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">Member since {new Date(item.created_at).getFullYear()}</p>
                    {profile?.trust_score !== undefined && (
                      <UserTrustBadge score={profile.trust_score} size="sm" />
                    )}
                  </div>
                </div>
              </div>
              {!isOwner && user && item.user_id && (
                <Button variant="outline" asChild>
                  <Link href={`/messages?item=${item.id}&user=${item.user_id}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href={`/items/${item.id}/print`} target="_blank">
                  <Download className="mr-2 h-4 w-4" />
                  Design Poster
                </Link>
              </Button>
            </div>

            {/* Description */}
            <section>
              <h2 className="text-xl font-semibold mb-4">About this item</h2>
              <div className="prose max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {item.description}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Badge variant="secondary" className="px-3 py-1 text-sm bg-muted text-foreground hover:bg-muted/80">
                  <Tag className="mr-2 h-3 w-3" />
                  {item.category}
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 text-sm bg-muted text-foreground hover:bg-muted/80">
                  <Calendar className="mr-2 h-3 w-3" />
                  {item.status === "lost" ? "Lost" : "Found"} on {new Date(item.date).toLocaleDateString()}
                </Badge>
              </div>
            </section>

            <Separator />

            {/* Map */}
            {item.latitude && item.longitude && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Location</h2>
                <div className="rounded-xl overflow-hidden border shadow-sm h-[300px]">
                  <MapWrapper
                    lat={item.latitude}
                    lng={item.longitude}
                    popupText={item.location || item.title}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {item.location}
                </p>
              </section>
            )}

            <Separator />

            {/* Comments */}
            <section>
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Comments</h2>
                <ItemComments itemId={item.id} itemOwnerId={item.user_id} currentUserId={user?.id || null} />
              </div>
            </section>

          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="relative">
            <div className="sticky top-8 space-y-6">

              {/* Action Card */}
              <Card className="shadow-lg border-border/60 overflow-hidden">
                <CardHeader className="bg-muted/30 py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Actions</CardTitle>
                    <Badge variant={item.is_active === false ? "outline" : "secondary"} className={item.is_active === false ? "border-amber-500 text-amber-600" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}>
                      {item.is_active === false ? "Resolved" : "Active"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ItemDetailClient
                    item={item}
                    viewerUserId={user?.id || null}
                    isOwner={isOwner}
                    questions={questions || []}
                    claims={claims}
                  />
                </CardContent>
              </Card>


              {/* Safety Tips */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="font-semibold">Safety First</h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span> Meet in public places
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span> Check item thoroughly
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span> Bring a friend along
                  </li>
                </ul>
              </div>

            </div>
          </div>

        </div>

        {/* Similar Items */}
        {similarItems && similarItems.length > 0 && (
          <div className="mt-20 pt-10 border-t">
            <h2 className="text-2xl font-bold mb-8">Similar items nearby</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarItems.map((similarItem) => (
                <ItemCard key={similarItem.id} item={similarItem} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
