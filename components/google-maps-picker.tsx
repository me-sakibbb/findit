"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPin, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Location {
  name: string
  lat: number
  lng: number
}

interface GoogleMapsPickerProps {
  value?: Location | null
  onSelect: (location: Location | null) => void
}

declare global {
  interface Window {
    google: any
    initMap?: () => void
  }
}

export function GoogleMapsPicker({ value, onSelect }: GoogleMapsPickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(value || null)
  const [isLoaded, setIsLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const autocompleteRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load Google Maps script
  useEffect(() => {
    if (typeof window.google !== "undefined") {
      setIsLoaded(true)
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    if (!apiKey) {
      console.error(
        "[v0] Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.",
      )
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`
    script.async = true
    script.defer = true

    window.initMap = () => {
      console.log("[v0] Google Maps loaded successfully")
      setIsLoaded(true)
    }

    script.onerror = () => {
      console.error("[v0] Failed to load Google Maps script")
    }

    document.head.appendChild(script)

    return () => {
      delete window.initMap
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!open || !isLoaded || !mapRef.current) return

    console.log("[v0] Initializing map")

    // Default to Dhaka, Bangladesh
    const defaultCenter = selectedLocation
      ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
      : { lat: 23.8103, lng: 90.4125 }

    // Create map
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: selectedLocation ? 14 : 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
    })
    mapInstanceRef.current = map

    // Create marker
    const marker = new window.google.maps.Marker({
      map,
      position: selectedLocation ? defaultCenter : null,
      draggable: true,
    })
    markerRef.current = marker

    // Handle marker drag
    marker.addListener("dragend", () => {
      const position = marker.getPosition()
      const lat = position.lat()
      const lng = position.lng()

      // Reverse geocode to get place name
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === "OK" && results[0]) {
          setSelectedLocation({
            name: results[0].formatted_address,
            lat,
            lng,
          })
        }
      })
    })

    // Handle map click
    map.addListener("click", (e: any) => {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()

      marker.setPosition({ lat, lng })
      marker.setMap(map)

      // Reverse geocode to get place name
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === "OK" && results[0]) {
          setSelectedLocation({
            name: results[0].formatted_address,
            lat,
            lng,
          })
        }
      })
    })

    // Initialize autocomplete
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        componentRestrictions: { country: "bd" }, // Restrict to Bangladesh
        fields: ["formatted_address", "geometry", "name"],
      })
      autocompleteRef.current = autocomplete

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          const name = place.formatted_address || place.name

          setSelectedLocation({ name, lat, lng })
          marker.setPosition({ lat, lng })
          marker.setMap(map)
          map.setCenter({ lat, lng })
          map.setZoom(14)
        }
      })
    }
  }, [open, isLoaded])

  const handleConfirm = () => {
    onSelect(selectedLocation)
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedLocation(null)
    onSelect(null)
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }
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
        <DialogContent className="max-w-3xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Location</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search for a location in Bangladesh..."
                className="w-full"
              />
            </div>
            <div ref={mapRef} className="flex-1 rounded-lg border" />
            {selectedLocation && <div className="text-sm text-muted-foreground">Selected: {selectedLocation.name}</div>}
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
