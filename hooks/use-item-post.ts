"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { categorizeItem } from "@/lib/actions/ai"

interface UseItemPostProps {
  type: "lost" | "found"
}

export function useItemPost({ type }: UseItemPostProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lng: number } | null>(null)
  const [date, setDate] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [categorizing, setCategorizing] = useState(false)
  const router = useRouter()

  const handleAutoCategorize = async () => {
    if (!title || !description) {
      toast.error("Missing information", { description: "Please provide both title and description first" })
      return
    }

    setCategorizing(true)
    try {
      console.log("[Form] Calling AI categorization...")
      const result = await categorizeItem(title, description)
      console.log("[Form] AI result:", result)
      
      if (result) {
        setCategory(result.category)

        toast.success("Category suggested!", { description: `AI suggests: ${result.category} (${Math.round(result.confidence * 100)}% confident)` })
      } else {
        toast.error("AI Suggest unavailable", { description: "Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local (free at aistudio.google.com)" })
      }
    } catch (error) {
      console.error("[Form] AI Suggest Error:", error)
      toast.error("Categorization failed", { description: "An error occurred. Check the console for details." })
    } finally {
      setCategorizing(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Not authenticated", { description: "Please log in to upload images" })
        setUploading(false)
        return
      }

      for (const file of Array.from(files)) {
        // Validate file type
          if (!file.type.startsWith("image/")) {
          toast.error("Invalid file type", { description: `${file.name} is not an image` })
          continue
        }

        // Validate file size (max 5MB)
        const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
          if (file.size > MAX_FILE_SIZE) {
          toast.error("File too large", { description: `${file.name} exceeds 5MB limit` })
          continue
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage.from("item-images").upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        })

        if (error) {
          console.error("[Upload] Error:", error)
          toast.error("Upload failed", { description: error.message })
          continue
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("item-images").getPublicUrl(data.path)

        uploadedUrls.push(publicUrl)
      }

      if (uploadedUrls.length > 0) {
        setImages([...images, ...uploadedUrls])
        toast.success("Images uploaded", { description: `${uploadedUrls.length} image(s) uploaded successfully` })
      }
    } catch (error) {
      console.error("[Upload] Error:", error)
      toast.error("Upload failed", { description: "Failed to upload images. Please try again." })
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Not authenticated", { description: "Please log in to post an item" })
        return
      }

      if (!selectedLocation) {
        toast.error("Location required", { description: "Please select a location on the map" })
        setSubmitting(false)
        return
      }

      const { data: newItem, error } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          status: type,
          title,
          description,
          category,
          location: selectedLocation.name,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          date,
          image_url: images[0] || null,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Item posted!", { description: `Your ${type} item has been posted successfully.` })

      router.push("/profile")
    } catch (error) {
      console.error("[v0] Submit error:", error)
      toast.error("Submission failed", { description: "Failed to post item. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    selectedLocation,
    setSelectedLocation,
    date,
    setDate,
    images,
    uploading,
    submitting,
    categorizing,
    handleAutoCategorize,
    handleImageUpload,
    removeImage,
    handleSubmit,
  }
}
