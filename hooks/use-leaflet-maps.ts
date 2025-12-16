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

  // Reverse geocode using Nominatim (OpenStreetMap)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "User-Agent": "FindItApp/1.0"
          }
        }
      )
      const data = await response.json()

      if (data && data.display_name) {
        setSelectedLocation({
          name: data.display_name,
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

  // Search for locations using Nominatim
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            "User-Agent": "FindItApp/1.0"
          }
        }
      )
      const data = await response.json()

      if (data && data.length > 0) {
        setSearchResults(data.map((item: any) => ({
          formatted: item.display_name,
          geometry: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
        })))
      } else {
        setSearchResults([{
          formatted: "No results found",
          geometry: { lat: 0, lng: 0 },
          disabled: true
        }])
      }
    } catch (error) {
      console.error("[Leaflet] Location search failed:", error)
      setSearchResults([{
        formatted: "❌ Search failed - Please check your connection",
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
    }, 1000)

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
