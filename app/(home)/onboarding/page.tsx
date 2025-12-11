"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    full_name: "",
    display_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    preferred_contact: "email" as "email" | "phone" | "both",
    email_notifications: true,
    push_notifications: false,
  })

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)

      // Pre-fill email and name from Google
      setFormData((prev) => ({
        ...prev,
        full_name: user.user_metadata?.full_name || "",
        display_name: user.user_metadata?.name || "",
      }))
    }
    getUser()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: formData.full_name,
        display_name: formData.display_name,
        phone: formData.phone,
        avatar_url: user.user_metadata?.avatar_url,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        preferred_contact: formData.preferred_contact,
        notification_preferences: {
          email: formData.email_notifications,
          push: formData.push_notifications,
        },
        is_onboarded: true,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      router.push("/profile")
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div className="flex min-h-svh items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to FindIt!</CardTitle>
            <CardDescription>Please complete your profile to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Personal Information</h3>

                  <div className="grid gap-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="display_name">Display Name *</Label>
                    <Input
                      id="display_name"
                      required
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="John D."
                    />
                    <p className="text-sm text-muted-foreground">This will be visible to other users</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Location</h3>

                  <div className="grid gap-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main Street, Apt 4B"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="San Francisco"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="CA"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="zip_code">ZIP Code *</Label>
                    <Input
                      id="zip_code"
                      required
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      placeholder="94102"
                    />
                  </div>
                </div>

                {/* Contact Preferences */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Contact Preferences</h3>

                  <div className="grid gap-2">
                    <Label htmlFor="preferred_contact">Preferred Contact Method *</Label>
                    <Select
                      value={formData.preferred_contact}
                      onValueChange={(value: "email" | "phone" | "both") =>
                        setFormData({ ...formData, preferred_contact: value })
                      }
                    >
                      <SelectTrigger id="preferred_contact">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Notification Preferences</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email_notifications"
                        checked={formData.email_notifications}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, email_notifications: checked as boolean })
                        }
                      />
                      <label htmlFor="email_notifications" className="text-sm cursor-pointer">
                        Email notifications for matches and messages
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="push_notifications"
                        checked={formData.push_notifications}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, push_notifications: checked as boolean })
                        }
                      />
                      <label htmlFor="push_notifications" className="text-sm cursor-pointer">
                        Push notifications (coming soon)
                      </label>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Complete Setup"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
