import { NextResponse } from "next/server"

// Bangladesh locations with coordinates (sample data - in production use a proper API)
const BANGLADESH_LOCATIONS = [
  { name: "Dhaka", division: "Dhaka", lat: 23.8103, lng: 90.4125 },
  { name: "Chittagong", division: "Chittagong", lat: 22.3569, lng: 91.7832 },
  { name: "Sylhet", division: "Sylhet", lat: 24.8949, lng: 91.8687 },
  { name: "Rajshahi", division: "Rajshahi", lat: 24.3745, lng: 88.6042 },
  { name: "Khulna", division: "Khulna", lat: 22.8456, lng: 89.5403 },
  { name: "Barisal", division: "Barisal", lat: 22.701, lng: 90.3535 },
  { name: "Rangpur", division: "Rangpur", lat: 25.7439, lng: 89.2752 },
  { name: "Mymensingh", division: "Mymensingh", lat: 24.7471, lng: 90.4203 },
  { name: "Comilla", division: "Chittagong", lat: 23.4607, lng: 91.1809 },
  { name: "Gazipur", division: "Dhaka", lat: 23.9999, lng: 90.4203 },
  { name: "Narayanganj", division: "Dhaka", lat: 23.6238, lng: 90.4995 },
  { name: "Cox's Bazar", division: "Chittagong", lat: 21.4272, lng: 92.0058 },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.toLowerCase() || ""

  const filtered = BANGLADESH_LOCATIONS.filter(
    (loc) => loc.name.toLowerCase().includes(query) || loc.division.toLowerCase().includes(query),
  )

  return NextResponse.json(filtered)
}
