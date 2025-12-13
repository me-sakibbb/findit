"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPin, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useLeafletMaps, Location } from "@/hooks/use-leaflet-maps"

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

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
  const {
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
  } = useLeafletMaps({ value, onSelect })

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
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm ${result.disabled ? 'text-muted-foreground cursor-default' : 'hover:bg-muted'}`}
                      onClick={() => handleSearchResultClick(result)}
                      disabled={result.disabled}
                    >
                      {result.formatted}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex-1 rounded-lg border overflow-hidden">
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
