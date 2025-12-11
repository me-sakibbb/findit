import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MapPin, MessageSquare, Tag } from "lucide-react"
import Link from "next/link"

interface ItemDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: item, error } = await supabase.from("items").select("*").eq("id", id).single()

  if (error || !item) {
    console.log("[v0] Item fetch error:", error)
    notFound()
  }

  let profile = null
  if (item.user_id) {
    const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", item.user_id).single()
    profile = data
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === item.user_id

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "?"

  return (
    <div className="min-h-svh flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            <div className="space-y-6">
              {/* Images */}
              <Card>
                <CardContent className="p-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full aspect-video object-cover rounded-t-lg"
                    />
                  ) : (
                    <img
                      src="/placeholder.svg?height=400&width=600"
                      alt={item.title}
                      className="w-full aspect-video object-cover rounded-t-lg"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">{item.title}</CardTitle>
                      <Badge variant={item.status === "lost" ? "destructive" : "default"}>
                        {item.status === "lost" ? "Lost Item" : "Found Item"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p className="font-medium text-sm">{item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-medium text-sm">
                          {item.city && item.state ? `${item.city}, ${item.state}` : item.location || "Not specified"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="font-medium text-sm">
                          {new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Poster Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Posted By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile?.full_name || "FindIt Community"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {!isOwner && user && item.user_id && (
                    <Button className="w-full" asChild>
                      <Link href={`/messages?item=${item.id}&user=${item.user_id}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Send Message
                      </Link>
                    </Button>
                  )}

                  {!user && item.user_id && (
                    <Button className="w-full" asChild>
                      <Link href="/auth/login">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Login to Contact
                      </Link>
                    </Button>
                  )}

                  {!item.user_id && (
                    <p className="text-sm text-muted-foreground text-center py-2">This is a featured community item</p>
                  )}

                  {isOwner && (
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href="/profile">View My Profile</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Safety Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Safety Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Meet in public places</li>
                    <li>• Verify item details before meeting</li>
                    <li>• Don't share personal information</li>
                    <li>• Report suspicious activity</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
