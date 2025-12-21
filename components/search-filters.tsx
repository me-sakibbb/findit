"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, X, MapPin, CalendarIcon, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import { UserSearch } from "./user-search"
import { DateRangePicker } from "./date-range-picker"
import { useSearchFilters } from "@/hooks/use-search-filters"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

// Dynamically import LeafletMapsPicker with no SSR to avoid "window is not defined" error
const LeafletMapsPicker = dynamic(
  () => import("./leaflet-maps-picker").then((mod) => mod.LeafletMapsPicker),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-12 flex items-center justify-center border rounded-md bg-muted">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    ),
  }
)

// CATEGORIES removed in favor of DB fetch

export function SearchFilters({ savedOnly }: { savedOnly?: boolean }) {
  const {
    searchQuery,
    setSearchQuery,
    type,
    setType,
    category,
    setCategory,
    location,
    setLocation,
    radius,
    setRadius,
    userId,
    setUserId,
    dateRange,
    setDateRange,
    applyFilters,
    clearFilters
  } = useSearchFilters(savedOnly)

  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name')

      if (data) {
        setCategories(data)
      }
    }
    fetchCategories()
  }, [supabase])

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
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
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
