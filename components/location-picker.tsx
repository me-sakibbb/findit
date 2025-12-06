"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MapPin, Check, Map } from "lucide-react"
import { cn } from "@/lib/utils"

interface Location {
  name: string
  division: string
  lat: number
  lng: number
}

interface LocationPickerProps {
  value?: string
  onSelect: (location: Location | null) => void
}

export function LocationPicker({ value, onSelect }: LocationPickerProps) {
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

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
            <MapPin className="mr-2 h-4 w-4 text-teal-600" />
            {selectedLocation ? `${selectedLocation.name}, ${selectedLocation.division}` : "Select location..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search locations..." value={searchQuery} onValueChange={setSearchQuery} />
            <CommandList>
              <CommandEmpty>No location found.</CommandEmpty>
              <CommandGroup>
                {locations.map((location) => (
                  <CommandItem
                    key={`${location.name}-${location.division}`}
                    onSelect={() => handleSelect(location)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedLocation?.name === location.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{location.name}</span>
                      <span className="text-xs text-muted-foreground">{location.division} Division</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedLocation && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Map className="h-3 w-3" />
          <span>
            Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  )
}
