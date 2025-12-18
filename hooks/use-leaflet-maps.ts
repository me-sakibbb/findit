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
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setMapCenter([lat, lng])
          setMapZoom(14)

          // Optionally reverse geocode to get location name (without selecting it)
          fetchLocationName(lat, lng).then((location) => {
            if (location) {
              setCurrentLocation(location)
            }
          })
        },
        (error) => {
          console.warn("[Leaflet] Geolocation error:", error.message)
          // Keep default Dhaka location
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    }
  }, [])

  // Update map center when selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      setMapCenter([selectedLocation.lat, selectedLocation.lng])
      setMapZoom(14)
    }
  }, [selectedLocation])

  // Fetch location name without setting it as selected
  const fetchLocationName = async (lat: number, lng: number): Promise<Location | null> => {
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

      const location: Location = data && data.display_name
        ? {
          name: data.display_name,
          lat,
          lng,
        }
        : {
          name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat,
          lng,
        }

      return location
    } catch (error) {
      console.error("[Leaflet] Reverse geocoding failed:", error)
      return {
        name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat,
        lng,
      }
    }
  }

  // Reverse geocode using Nominatim (OpenStreetMap) and set as selected
  const reverseGeocode = async (lat: number, lng: number) => {
    const location = await fetchLocationName(lat, lng)
    if (location) {
      setSelectedLocation(location)
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
      // 1. Define the bias area (approx. 0.1 degree offset creates a ~10km box)
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;

      // 2. Add location bias if currentLocation exists
      // currentLocation = { lat: number, lng: number }
      if (currentLocation) {
        const { lat, lng } = currentLocation;
        const offset = 0.1; // Adjust this value to increase/decrease the search radius
        const viewbox = `${lng - offset},${lat + offset},${lng + offset},${lat - offset}`;

        // bounded=1 tells Nominatim to prioritize or restrict to this box
        url += `&viewbox=${viewbox}&bounded=0`;
      }

      const response = await fetch(url, {
        headers: { "User-Agent": "FindItApp/1.0" }
      })

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
        formatted: "❌ Search failed",
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
