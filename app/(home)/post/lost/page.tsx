import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ItemPostForm } from "@/components/item-post-form"

export default async function PostLostPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-svh flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-3xl py-8">
          <ItemPostForm type="lost" />
        </div>
      </main>
    </div>
  )
}
