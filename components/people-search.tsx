"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Package, CheckCircle, Award, X } from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Profile {
  id: string
  full_name: string
  avatar_url?: string
  bio?: string
  city?: string
  state?: string
  created_at: string
  stats: {
    totalItems: number
    activeItems: number
    resolvedItems: number
    lostItems: number
    foundItems: number
  }
}

interface PeopleSearchProps {
  profiles: Profile[]
  initialFilters: {
    query: string
    city: string
    state: string
  }
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
]

export function PeopleSearch({ profiles, initialFilters }: PeopleSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialFilters.query)
  const [city, setCity] = useState(initialFilters.city)
  const [state, setState] = useState(initialFilters.state)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.set("query", query)
    if (city) params.set("city", city)
    if (state) params.set("state", state)
    
    router.push(`/people?${params.toString()}`)
  }

  const clearFilters = () => {
    setQuery("")
    setCity("")
    setState("")
    router.push("/people")
  }

  const hasActiveFilters = query || city || state

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} className="sm:w-auto">
                Search
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Input
                  placeholder="Filter by city..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by state..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {profiles.length} {profiles.length === 1 ? "person" : "people"} found
        </p>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No people found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Try adjusting your search criteria or clearing filters to see more results.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => {
            const initials = profile.full_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() || "?"

            const successRate = profile.stats.totalItems > 0
              ? Math.round((profile.stats.resolvedItems / profile.stats.totalItems) * 100)
              : 0

            return (
              <Link key={profile.id} href={`/profile?id=${profile.id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                          {profile.stats.resolvedItems >= 5 && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Award className="h-3 w-3" />
                              Trusted
                            </Badge>
                          )}
                        </div>

                        {profile.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {profile.bio}
                          </p>
                        )}

                        {(profile.city || profile.state) && (
                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {profile.city && profile.state
                                ? `${profile.city}, ${profile.state}`
                                : profile.city || profile.state}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="w-full pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <Package className="h-3 w-3" />
                              <span className="text-xs">Items</span>
                            </div>
                            <p className="text-lg font-semibold">{profile.stats.totalItems}</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs">Success</span>
                            </div>
                            <p className="text-lg font-semibold">{successRate}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
