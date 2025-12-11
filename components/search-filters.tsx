"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, X, MapPin, CalendarIcon } from "lucide-react"
import { useState } from "react"
import { LeafletMapsPicker } from "./leaflet-maps-picker"
import { UserSearch } from "./user-search"
import { DateRangePicker } from "./date-range-picker"
import type { DateRange } from "react-day-picker"

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Accessories",
  "Documents",
  "Keys",
  "Bags",
  "Books",
  "Jewelry",
  "Sports Equipment",
  "Other",
]

export function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [type, setType] = useState(searchParams.get("type") || "all")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [location, setLocation] = useState<{ name: string; lat: number; lng: number } | null>(null)
  const [radius, setRadius] = useState(searchParams.get("radius") || "10")
  const [userId, setUserId] = useState<string | null>(searchParams.get("userId") || null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (searchQuery) params.set("q", searchQuery)
    if (type !== "all") params.set("type", type)
    if (category !== "all") params.set("category", category)
    if (location) {
      params.set("locationName", location.name)
      params.set("lat", location.lat.toString())
      params.set("lng", location.lng.toString())
      params.set("radius", radius)
    }
    if (userId) params.set("userId", userId)
    if (dateRange?.from) {
      params.set("dateFrom", dateRange.from.toISOString())
      if (dateRange.to) {
        params.set("dateTo", dateRange.to.toISOString())
      }
    }

    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setType("all")
    setCategory("all")
    setLocation(null)
    setRadius("10")
    setUserId(null)
    setDateRange(undefined)
    router.push("/search")
  }

  return (
    <Card className="sticky top-24 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Filter Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Search Keywords */}
        <div className="space-y-2">
          <Label htmlFor="search-query" className="text-sm font-medium">
            Search Keywords
          </Label>
          <div className="relative">
            <Input
              id="search-query"
              placeholder="e.g., wallet, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyFilters()
                }
              }}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Item Type */}
        <div className="space-y-2">
          <Label htmlFor="type-filter" className="text-sm font-medium">
            Item Type
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="lost">Lost Items</SelectItem>
              <SelectItem value="found">Found Items</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category-filter" className="text-sm font-medium">
            Category
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filters */}
        <div className="pt-3 border-t space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-teal-600" />
            <span>Location Filters</span>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Location</Label>
            <LeafletMapsPicker value={location} onSelect={setLocation} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="radius-filter" className="text-sm font-medium">
              Search Radius: {radius} km
            </Label>
            <Input
              id="radius-filter"
              type="range"
              min="1"
              max="100"
              step="5"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full"
              disabled={!location}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 km</span>
              <span>100 km</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t">
          <Label className="text-sm font-medium">Posted By</Label>
          <UserSearch value={userId || undefined} onSelect={setUserId} />
          {userId && (
            <Button variant="ghost" size="sm" onClick={() => setUserId(null)} className="w-full">
              <X className="h-3 w-3 mr-1" />
              Clear user filter
            </Button>
          )}
        </div>

        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarIcon className="h-4 w-4 text-teal-600" />
            <span>Posted Between</span>
          </div>
          <DateRangePicker value={dateRange} onSelect={setDateRange} />
          {dateRange?.from && (
            <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)} className="w-full">
              <X className="h-3 w-3 mr-1" />
              Clear date filter
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button onClick={clearFilters} variant="outline" size="icon" title="Clear filters">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
