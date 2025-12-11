"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient()

      // Get the authenticated user
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push("/auth/login")
        return
      }

      // Check if user has completed onboarding
      const { data: profile } = await supabase.from("profiles").select("is_onboarded").eq("id", user.id).single()

      if (profile && profile.is_onboarded) {
        router.push("/profile")
      } else {
        router.push("/onboarding")
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Signing you in...</h2>
        <p className="text-muted-foreground mt-2">Please wait</p>
      </div>
    </div>
  )
}
