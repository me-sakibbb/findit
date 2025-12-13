"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast as sonnerToast } from "sonner"

interface Profile {
  id: string
  full_name: string
  avatar_url?: string
  bio?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  preferred_contact?: "email" | "phone" | "both"
}

export function useProfileForm(profile: Profile | null) {
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")
  const [uploading, setUploading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      setAvatarUrl(data.url)

      sonnerToast.success("Avatar uploaded", { description: "Your profile picture has been updated" })
    } catch (error) {
      sonnerToast.error("Upload failed", { description: "Failed to upload avatar. Please try again." })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio,
          phone,
          avatar_url: avatarUrl,
        })
        .eq("id", profile?.id)

      if (error) throw error

      sonnerToast.success("Profile updated", { description: "Your profile has been saved successfully" })
    } catch (error) {
      console.error("Error updating profile:", error)
      sonnerToast.error("Update failed", { description: "Failed to update profile. Please try again." })
    } finally {
      setUpdating(false)
    }
  }

  return {
    fullName,
    setFullName,
    bio,
    setBio,
    phone,
    setPhone,
    avatarUrl,
    setAvatarUrl,
    uploading,
    updating,
    handleAvatarUpload,
    handleSubmit,
  }
}

export function useProfileEditModal(profile: Profile | null) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "",
    zip_code: profile?.zip_code || "",
    preferred_contact: profile?.preferred_contact || "both",
  })
  
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      
      if (!e.target.files || e.target.files.length === 0) {
        return
      }

      const file = e.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile?.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const supabase = createBrowserClient()

      const { error: uploadError } = await supabase.storage
        .from("items")
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("items").getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      
      sonnerToast.success("Avatar uploaded successfully!")
    } catch (error) {
      console.error("Error uploading avatar:", error)
      sonnerToast.error("Failed to upload avatar")
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setLoading(true)
      const supabase = createBrowserClient()

      const { error } = await supabase
        .from("profiles")
        .update({
          ...formData,
          avatar_url: avatarUrl,
        })
        .eq("id", profile?.id)

      if (error) throw error

      sonnerToast.success("Profile updated successfully!")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      sonnerToast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return {
    open,
    setOpen,
    loading,
    uploading,
    formData,
    setFormData,
    avatarUrl,
    handleAvatarUpload,
    handleSubmit,
  }
}
