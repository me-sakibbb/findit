"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MessageSquare,
  Calendar,
  Package,
  CheckCircle,
  MapPin,
  TrendingUp,
  Award,
  Clock
} from "lucide-react"
import Link from "next/link"

interface PublicProfileViewProps {
  profile: {
    id: string
    full_name: string
    avatar_url: string
    bio: string
    created_at: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zip_code?: string
    preferred_contact?: string
  }
  currentUserId?: string
  items: any[]
  stats: {
    totalItems: number
    activeItems: number
    resolvedItems: number
    lostItems: number
    foundItems: number
  }
  recentActivity?: {
    lastActive?: string
    itemsThisMonth?: number
  }
  editButton?: React.ReactNode
}

export function PublicProfileView({ profile, currentUserId, items, stats, recentActivity, editButton }: PublicProfileViewProps) {
  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"

  const isOwnProfile = currentUserId === profile.id

  // Calculate success rate
  const successRate = stats.totalItems > 0
    ? Math.round((stats.resolvedItems / stats.totalItems) * 100)
    : 0

  // Get user location from profile or fallback to recent item location
  const userLocation = profile.city && profile.state
    ? `${profile.city}, ${profile.state}`
    : items.length > 0 && items[0].city && items[0].state
      ? `${items[0].city}, ${items[0].state}`
      : items.length > 0
        ? items[0].location
        : null

  return (
    <div className="space-y-6">
      {/* Cover/Header Section */}
      <div className="relative">
        <div className="h-48 bg-linear-to-r from-primary/20 via-primary/10 to-background rounded-t-xl"></div>
        <div className="absolute -bottom-16 left-8">
          <Avatar className="h-32 w-32 border-4 border-background shadow-2xl ring-2 ring-primary/20">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
            <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile Info Section */}
      <Card className="pt-20">
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                {stats.resolvedItems >= 5 && (
                  <Badge variant="secondary" className="gap-1">
                    <Award className="h-3 w-3" />
                    Trusted Helper
                  </Badge>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mb-4 max-w-2xl leading-relaxed">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Joined {new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {userLocation && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{userLocation}</span>
                  </div>
                )}

                {recentActivity?.lastActive && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Last active {new Date(recentActivity.lastActive).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 md:min-w-[200px]">
              {isOwnProfile && editButton ? (
                editButton
              ) : !isOwnProfile && currentUserId ? (
                <Button asChild size="lg" className="w-full bg-primary">
                  <Link href={`/messages?user=${profile.id}`}>
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Send Message
                  </Link>
                </Button>
              ) : !isOwnProfile && !currentUserId ? (
                <Button asChild size="lg" variant="outline" className="w-full">
                  <Link href="/auth/login">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Login to Message
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold text-primary">{stats.totalItems}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Posts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-3xl font-bold text-green-600">{stats.resolvedItems}</div>
              <p className="text-sm text-muted-foreground mt-1">Resolved</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto mb-2 flex justify-center">
                <Badge variant="destructive" className="text-base px-3 py-1">Lost</Badge>
              </div>
              <div className="text-3xl font-bold">{stats.lostItems}</div>
              <p className="text-sm text-muted-foreground mt-1">Lost Items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto mb-2 flex justify-center">
                <Badge className="text-base px-3 py-1">Found</Badge>
              </div>
              <div className="text-3xl font-bold">{stats.foundItems}</div>
              <p className="text-sm text-muted-foreground mt-1">Found Items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-3xl font-bold text-blue-600">{successRate}%</div>
              <p className="text-sm text-muted-foreground mt-1">Success Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* About Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>About {profile.full_name}</CardTitle>
            <CardDescription>Member information and activity overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Package className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Active Listings</p>
                  <p className="text-sm text-muted-foreground">{stats.activeItems} items currently active</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="h-5 w-5 mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium">Successful Returns</p>
                  <p className="text-sm text-muted-foreground">{stats.resolvedItems} items successfully resolved</p>
                </div>
              </div>

              {recentActivity?.itemsThisMonth !== undefined && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="h-5 w-5 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-medium">This Month</p>
                    <p className="text-sm text-muted-foreground">{recentActivity.itemsThisMonth} new posts</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 mt-0.5 text-purple-600" />
                <div>
                  <p className="font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {stats.resolvedItems >= 5 && (
              <>
                <Separator />
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Award className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-primary">Trusted Helper Badge</p>
                    <p className="text-sm text-muted-foreground">
                      This user has successfully helped reunite {stats.resolvedItems} items with their owners
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Activity breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Lost Items</span>
                <span className="text-sm text-muted-foreground">{stats.lostItems}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.totalItems > 0 ? (stats.lostItems / stats.totalItems) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Found Items</span>
                <span className="text-sm text-muted-foreground">{stats.foundItems}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.totalItems > 0 ? (stats.foundItems / stats.totalItems) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Resolution Rate</span>
                <span className="text-sm text-muted-foreground">{successRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
