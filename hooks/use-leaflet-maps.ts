import { useState, useEffect } from "react"

export interface Location {
  name: string
  lat: number
  lng: number
}

interface UseLeafletMapsProps {
  value?: Location | null
  onSelect: (location: Location | null) => void
}

export function useLeafletMaps({ value, onSelect }: UseLeafletMapsProps) {
  const [open, setOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(value || null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.8103, 90.4125]) // Default to Dhaka
  const [mapZoom, setMapZoom] = useState(12)

  // Update map center when selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      setMapCenter([selectedLocation.lat, selectedLocation.lng])
      setMapZoom(14)
    }
  }, [selectedLocation])

  // Reverse geocode using OpenCage API
  const reverseGeocode = async (lat: number, lng: number) => {
    const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY
    if (!apiKey) {
      console.warn("[Leaflet] OpenCage API key not found. Using coordinates as location name.")
      setSelectedLocation({
        name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat,
        lng,
      })
      return
    }

    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`
      )
      const data = await response.json()
      
      console.log("[Leaflet] Reverse geocode response:", data) // Debug log
      
      if (data.results && data.results[0]) {
        setSelectedLocation({
          name: data.results[0].formatted,
          lat,
          lng,
        })
      } else {
        setSelectedLocation({
          name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat,
          lng,
        })
      }
    } catch (error) {
      console.error("[Leaflet] Reverse geocoding failed:", error)
      setSelectedLocation({
        name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat,
        lng,
      })
    }
  }

  // Search for locations using OpenCage API
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY
    if (!apiKey) {
      console.warn("[Leaflet] OpenCage API key not found. Search disabled.")
      setSearchResults([{
        formatted: "⚠️ Search disabled - Add OpenCage API key to enable",
        geometry: { lat: 0, lng: 0 },
        disabled: true
      }])
      return
    }

    setIsSearching(true)
    try {
      // Remove country restriction to allow worldwide search
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5`
      )
      const data = await response.json()
      
      console.log("[Leaflet] Search response:", data) // Debug log
      
      if (data.status?.code === 402) {
        setSearchResults([{
          formatted: "⚠️ API quota exceeded - Please try again later",
          geometry: { lat: 0, lng: 0 },
          disabled: true
        }])
      } else if (data.results && data.results.length > 0) {
        setSearchResults(data.results)
      } else {
        setSearchResults([{
          formatted: "No results found - Try a different search term",
          geometry: { lat: 0, lng: 0 },
          disabled: true
        }])
      }
    } catch (error) {
      console.error("[Leaflet] Location search failed:", error)
      setSearchResults([{
        formatted: "❌ Search failed - Please check your internet connection",
        geometry: { lat: 0, lng: 0 },
        disabled: true
      }])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocation(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleMapClick = (lat: number, lng: number) => {
    reverseGeocode(lat, lng)
  }

  const handleSearchResultClick = (result: any) => {
    if (result.disabled) return
    
    const lat = result.geometry.lat
    const lng = result.geometry.lng
    setSelectedLocation({
      name: result.formatted,
      lat,
      lng,
    })
    setMapCenter([lat, lng])
    setMapZoom(14)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleConfirm = () => {
    onSelect(selectedLocation)
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedLocation(null)
    onSelect(null)
  }

  return {
    open,
    setOpen,
    selectedLocation,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    mapCenter,
    mapZoom,
    handleMapClick,
    handleSearchResultClick,
    handleConfirm,
    handleClear
  }
}
