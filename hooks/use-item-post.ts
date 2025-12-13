"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
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
  const { toast } = useToast()

  const handleAutoCategorize = async () => {
    if (!title || !description) {
      toast({
        title: "Missing information",
        description: "Please provide both title and description first",
        variant: "destructive",
      })
      return
    }

    setCategorizing(true)
    try {
      console.log("[Form] Calling AI categorization...")
      const result = await categorizeItem(title, description)
      console.log("[Form] AI result:", result)
      
      if (result) {
        setCategory(result.category)

        toast({
          title: "Category suggested!",
          description: `AI suggests: ${result.category} (${Math.round(result.confidence * 100)}% confident)`,
        })
      } else {
        toast({
          title: "AI Suggest unavailable",
          description: "Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local (free at aistudio.google.com)",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Form] AI Suggest Error:", error)
      toast({
        title: "Categorization failed",
        description: "An error occurred. Check the console for details.",
        variant: "destructive",
      })
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
        toast({
          title: "Not authenticated",
          description: "Please log in to upload images",
          variant: "destructive",
        })
        setUploading(false)
        return
      }

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image`,
            variant: "destructive",
          })
          continue
        }

        // Validate file size (max 5MB)
        const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 5MB limit`,
            variant: "destructive",
          })
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
          toast({
            title: "Upload failed",
            description: error.message,
            variant: "destructive",
          })
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
        toast({
          title: "Images uploaded",
          description: `${uploadedUrls.length} image(s) uploaded successfully`,
        })
      }
    } catch (error) {
      console.error("[Upload] Error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      })
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
        toast({
          title: "Not authenticated",
          description: "Please log in to post an item",
          variant: "destructive",
        })
        return
      }

      if (!selectedLocation) {
        toast({
          title: "Location required",
          description: "Please select a location on the map",
          variant: "destructive",
        })
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

      toast({
        title: "Item posted!",
        description: `Your ${type} item has been posted successfully.`,
      })

      router.push("/profile")
    } catch (error) {
      console.error("[v0] Submit error:", error)
      toast({
        title: "Submission failed",
        description: "Failed to post item. Please try again.",
        variant: "destructive",
      })
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
