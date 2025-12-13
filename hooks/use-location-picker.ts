import { useState, useEffect } from "react"

export interface Location {
  name: string
  division: string
  lat: number
  lng: number
}

interface UseLocationPickerProps {
  value?: string
  onSelect: (location: Location | null) => void
}

export function useLocationPicker({ value, onSelect }: UseLocationPickerProps) {
  const [open, setOpen] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`/api/locations?q=${searchQuery}`)
        const data = await response.json()
        setLocations(data)
      } catch (error) {
        console.error("[v0] Error fetching locations:", error)
      }
    }

    fetchLocations()
  }, [searchQuery])

  const handleSelect = (location: Location) => {
    setSelectedLocation(location)
    onSelect(location)
    setOpen(false)
  }

  return {
    open,
    setOpen,
    locations,
    searchQuery,
    setSearchQuery,
    selectedLocation,
    handleSelect,
  }
}
