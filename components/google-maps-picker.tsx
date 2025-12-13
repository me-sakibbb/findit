"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPin, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useGoogleMaps, Location } from "@/hooks/use-google-maps"

interface GoogleMapsPickerProps {
  value?: Location | null
  onSelect: (location: Location | null) => void
}

export function GoogleMapsPicker({ value, onSelect }: GoogleMapsPickerProps) {
  const {
    open,
    setOpen,
    selectedLocation,
    mapRef,
    searchInputRef,
    handleConfirm,
    handleClear
  } = useGoogleMaps({ value, onSelect })

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
