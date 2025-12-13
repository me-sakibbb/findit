import { useState, useEffect, useRef } from "react"

export interface Location {
  name: string
  lat: number
  lng: number
}

interface UseGoogleMapsProps {
  value?: Location | null
  onSelect: (location: Location | null) => void
}

declare global {
  interface Window {
    google: any
    initMap?: () => void
  }
}

export function useGoogleMaps({ value, onSelect }: UseGoogleMapsProps) {
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

  return {
    open,
    setOpen,
    selectedLocation,
    mapRef,
    searchInputRef,
    handleConfirm,
    handleClear
  }
}
