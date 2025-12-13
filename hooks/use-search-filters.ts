import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { DateRange } from "react-day-picker"

export interface Location {
  name: string
  lat: number
  lng: number
}

export function useSearchFilters(savedOnly?: boolean) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [type, setType] = useState(searchParams.get("type") || "all")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [location, setLocation] = useState<Location | null>(null)
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

    if (savedOnly) {
      router.push(`/saved?${params.toString()}`)
    } else {
      router.push(`/search?${params.toString()}`)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setType("all")
    setCategory("all")
    setLocation(null)
    setRadius("10")
    setUserId(null)
    setDateRange(undefined)
    if (savedOnly) {
      router.push("/saved")
    } else {
      router.push("/search")
    }
  }

  return {
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
  }
}
