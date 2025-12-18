"use client"

import dynamic from "next/dynamic"

const LeafletMap = dynamic(() => import("@/components/leaflet-map-viewer"), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">
            Loading map...
        </div>
    ),
})

interface MapWrapperProps {
    lat: number
    lng: number
    popupText?: string
}

export function MapWrapper({ lat, lng, popupText }: MapWrapperProps) {
    return <LeafletMap lat={lat} lng={lng} popupText={popupText} />
}
