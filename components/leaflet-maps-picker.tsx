"use client"

import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPin, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface Location {
  name: string
  lat: number
  lng: number
}

interface LeafletMapsPickerProps {
  value?: Location | null
  onSelect: (location: Location | null) => void
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Component to update map view when location changes
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  
  return null
}

export function LeafletMapsPicker({ value, onSelect }: LeafletMapsPickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(value || null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.8103, 90.4125]) // Default to Dhaka
  const [mapZoom, setMapZoom] = useState(12)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude
          const userLng = position.coords.longitude
          setUserLocation([userLat, userLng])
          // Set map center to user's location if no location is selected
          if (!selectedLocation) {
            setMapCenter([userLat, userLng])
            setMapZoom(13)
          }
          console.log("[Leaflet] User location obtained:", userLat, userLng)
        },
        (error) => {
          console.warn("[Leaflet] Could not get user location:", error.message)
          // Fall back to default location (Dhaka)
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0
        }
      )
    } else {
      console.warn("[Leaflet] Geolocation is not supported by this browser")
    }
  }, [])

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
      // Use user's location for proximity if available, otherwise use map center
      const proximityLat = userLocation ? userLocation[0] : mapCenter[0]
      const proximityLng = userLocation ? userLocation[1] : mapCenter[1]
      
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5&proximity=${proximityLat},${proximityLng}`
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

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
            <MapPin className="mr-2 h-4 w-4 text-teal-600" />
            {selectedLocation ? selectedLocation.name : "Select location from map..."}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl h-[600px] flex flex-col" aria-describedby="location-dialog-description">
          <DialogHeader>
            <DialogTitle>Select Location</DialogTitle>
            <p id="location-dialog-description" className="sr-only">
              Search for a location or click on the map to select a location
            </p>
          </DialogHeader>
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative" style={{ zIndex: 1000 }}>
              <Input
                type="text"
                placeholder={process.env.NEXT_PUBLIC_OPENCAGE_API_KEY ? "Search for a location..." : "Search disabled - Click on map to select location"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                disabled={!process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto" style={{ zIndex: 1001 }}>
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm border-b last:border-b-0 ${result.disabled ? 'text-muted-foreground cursor-default bg-muted/50' : 'hover:bg-accent hover:text-accent-foreground'}`}
                      onClick={() => handleSearchResultClick(result)}
                      disabled={result.disabled}
                    >
                      {result.formatted}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex-1 rounded-lg border overflow-hidden" style={{ zIndex: 1 }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onLocationSelect={handleMapClick} />
                <MapUpdater center={mapCenter} zoom={mapZoom} />
                {selectedLocation && (
                  <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
                )}
              </MapContainer>
            </div>
            
            {selectedLocation && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedLocation.name}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleConfirm} className="flex-1">
                Confirm Location
              </Button>
              <Button variant="outline" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedLocation && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <span className="truncate">{selectedLocation.name}</span>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={handleClear}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
