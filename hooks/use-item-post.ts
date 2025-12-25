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
  // Category is now automated
  const [rewardAmount, setRewardAmount] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lng: number } | null>(null)
  const [date, setDate] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [categorizing, setCategorizing] = useState(false)
  const [questions, setQuestions] = useState<{ text: string; answer: string }[]>([])
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const router = useRouter()

  // Auto-categorize logic removed as it's now handled by Edge Function on submit

  const generateQuestions = async () => {
    if (!title || !description) {
      toast.error("Missing information", { description: "Please provide both title and description first" })
      return
    }

    setGeneratingQuestions(true)
    try {
      const response = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })

      if (!response.ok) throw new Error("Failed to generate questions")

      const data = await response.json()
      if (data.questions && Array.isArray(data.questions)) {
        const newQuestions = data.questions.map((q: string) => ({ text: q, answer: "" }))
        setQuestions([...questions, ...newQuestions])
        toast.success("Questions generated", { description: `Added ${data.questions.length} questions` })
      }
    } catch (error) {
      console.log("Error generating questions:", error)
      toast.error("Generation failed", { description: "Could not generate questions. Please try again." })
    } finally {
      setGeneratingQuestions(false)
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

      // Dynamic import of compression utility
      const { compressImage, formatSizeReduction } = await import("@/lib/image-utils")

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error("Invalid file type", { description: `${file.name} is not an image` })
          continue
        }

        // Validate file size (max 10MB before compression)
        const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
        if (file.size > MAX_FILE_SIZE) {
          toast.error("File too large", { description: `${file.name} exceeds 10MB limit` })
          continue
        }

        // Compress image before upload
        let fileToUpload: File = file
        try {
          const originalSize = file.size
          fileToUpload = await compressImage(file)
          const compressedSize = fileToUpload.size

          if (compressedSize < originalSize) {
            console.log(`[Upload] Compressed: ${formatSizeReduction(originalSize, compressedSize)}`)
          }
        } catch (compressError) {
          console.warn("[Upload] Compression failed, uploading original:", compressError)
          // Continue with original file if compression fails
        }

        // Generate unique filename (now with jpg extension since compressed)
        const fileExt = fileToUpload.name.split(".").pop() || "jpg"
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage.from("item-images").upload(fileName, fileToUpload, {
          contentType: fileToUpload.type,
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
          category: "Uncategorized", // Will be updated by AI
          location: selectedLocation.name,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          date,
          image_url: images[0] || null,
          is_active: true,
          reward_amount: rewardAmount ? Number.parseFloat(rewardAmount) : null,
        })
        .select()
        .single()

      if (error) throw error

      // Insert questions if any
      if (questions.length > 0) {
        const { error: questionsError } = await supabase.from("questions").insert(
          questions.map((q) => ({
            item_id: newItem.id,
            question_text: q.text,
            correct_answer: q.answer || null,
          })),
        )

        if (questionsError) {
          console.error("Error saving questions:", questionsError)
          // Don't block success, but notify
          toast.error("Warning", { description: "Item posted but questions failed to save." })
        }
      }

      // Trigger AI matching (fire-and-forget)
      void supabase.functions.invoke('find-potential-matches', {
        body: { item_id: newItem.id }
      })

      // Trigger AI categorization (fire-and-forget)
      void supabase.functions.invoke('suggest-category', {
        body: { record: newItem }
      })

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
    rewardAmount,
    setRewardAmount,
    // category,
    // setCategory,
    selectedLocation,
    setSelectedLocation,
    date,
    setDate,
    images,
    uploading,
    submitting,
    categorizing,
    // handleAutoCategorize,
    handleImageUpload,
    removeImage,
    handleSubmit,
    questions,
    setQuestions,
    generatingQuestions,
    generateQuestions,
  }
}
