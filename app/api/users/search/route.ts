import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.toLowerCase() || ""

  const supabase = await createServerClient()

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, avatar_url")
    .or(`full_name.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(10)

  if (error) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(users || [])
}
