"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Loader2, Sparkles } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { categorizeItem } from "@/lib/actions/ai"

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Accessories",
  "Documents",
  "Keys",
  "Bags",
  "Books",
  "Jewelry",
  "Sports Equipment",
  "Other",
]

interface ItemPostFormProps {
  type: "lost" | "found"
}

export function ItemPostForm({ type }: ItemPostFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
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
      const { categorizeItem } = await import("@/lib/supabase/client-utils")
      const result = await categorizeItem(title, description)
      setCategory(result.category)

      toast({
        title: "Category suggested!",
        description: `AI suggests: ${result.category} (${Math.round(result.confidence * 100)}% confident)`,
      })
    } catch (error) {
      toast({
        title: "Categorization failed",
        description: "Failed to auto-categorize. Please select manually.",
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
      const { uploadFile } = await import("@/lib/supabase/client-utils")
      
      for (const file of Array.from(files)) {
        const result = await uploadFile(file)
        uploadedUrls.push(result.url)
      }

      setImages([...images, ...uploadedUrls])
      toast({
        title: "Images uploaded",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      })
    } catch (error) {
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

      const { data: newItem, error } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          status: type,
          title,
          description,
          category,
          location,
          city,
          state,
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

      router.push("/dashboard")
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post a {type === "lost" ? "Lost" : "Found"} Item</CardTitle>
        <CardDescription>Provide as much detail as possible to help others identify the item</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Item Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Blue iPhone 15 Pro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Category *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAutoCategorize}
                disabled={categorizing || !title || !description}
              >
                {categorizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Categorizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Suggest
                  </>
                )}
              </Button>
            </div>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">General Location *</Label>
            <Input
              id="location"
              placeholder="e.g., Central Park, Near 5th Avenue"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="e.g., New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                placeholder="e.g., NY"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date {type === "lost" ? "Lost" : "Found"} *</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Images (Optional)</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Images
                  </>
                )}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <span className="text-sm text-muted-foreground">{images.length} image(s) uploaded</span>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              `Post ${type === "lost" ? "Lost" : "Found"} Item`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
