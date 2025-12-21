"use client"

import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Loader2, Sparkles } from "lucide-react"
import dynamic from "next/dynamic"
import { useItemPost } from "@/hooks/use-item-post"
import { QuestionModal } from "@/components/question-modal"
import { ShieldCheck } from "lucide-react"

// Dynamically import LeafletMapsPicker with no SSR to avoid "window is not defined" error
const LeafletMapsPicker = dynamic(() => import("@/components/leaflet-maps-picker").then((mod) => mod.LeafletMapsPicker), {
  ssr: false,
  loading: () => (
    <div className="w-full h-12 flex items-center justify-center border rounded-md bg-muted">
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
      <span className="text-sm text-muted-foreground">Loading map...</span>
    </div>
  ),
})

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
  const {
    title,
    setTitle,
    description,
    setDescription,
    selectedLocation,
    setSelectedLocation,
    date,
    setDate,
    images,
    uploading,
    submitting,
    categorizing,
    handleImageUpload,
    removeImage,
    handleSubmit,
    questions,
    setQuestions,
    generatingQuestions,
    generateQuestions,
  } = useItemPost({ type })

  const [questionModalOpen, setQuestionModalOpen] = useState(false)

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

          {/* Category selection removed - automated by AI */}

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <LeafletMapsPicker value={selectedLocation} onSelect={setSelectedLocation} />
            {!selectedLocation && (
              <p className="text-sm text-muted-foreground">
                Click the button above to select a location on the map or search for a place
              </p>
            )}
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

          {type === "found" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Verification Questions (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestionModalOpen(true)}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Manage Questions ({questions.length})
                </Button>
              </div>
              {questions.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {questions.length} question{questions.length !== 1 ? "s" : ""} set for verification.
                </div>
              )}
            </div>
          )}

          <QuestionModal
            open={questionModalOpen}
            onOpenChange={setQuestionModalOpen}
            questions={questions}
            setQuestions={setQuestions}
            onGenerateAI={generateQuestions}
            isGenerating={generatingQuestions}
          />

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
