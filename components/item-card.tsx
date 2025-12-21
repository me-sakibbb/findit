"use client"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, MoreVertical, Bookmark, Shield, CheckCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ClaimModal } from "@/components/claim-modal"

interface ItemCardProps {
  item: {
    id: string
    user_id: string
    status: string
    title: string
    description: string
    category: string
    location: string
    date: string
    image_url: string | null
    created_at: string
    reward_amount?: number | null
    currency?: string | null
    profiles?: {
      full_name?: string | null
      avatar_url?: string | null
    } | null
  }
}

export function ItemCard({ item }: ItemCardProps) {
  const supabase = createBrowserClient()
  const [saved, setSaved] = useState(false)
  const [claimModalOpen, setClaimModalOpen] = useState(false)
  const [itemQuestions, setItemQuestions] = useState<any[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const checkSaved = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setSaved(false)
        return
      }

      const { data } = await supabase
        .from("saved_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", item.id)
        .maybeSingle()

      setSaved(!!data)
    } catch (err) {
      console.error("Error checking saved state:", err)
    }
  }, [item.id, supabase])

  useEffect(() => {
    checkSaved()
  }, [checkSaved])

  const toggleSaved = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.success("Sign in required", { description: "Please sign in to save items." })
        return
      }

      if (saved) {
        // remove
        const { error } = await supabase
          .from("saved_items")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", item.id)

        if (error) throw error
        setSaved(false)
        toast.success("Removed", { description: "Item removed from saved items." })
      } else {
        // add
        const { error } = await supabase.from("saved_items").insert({ user_id: user.id, item_id: item.id })
        if (error) throw error
        setSaved(true)
        toast.success("Saved", { description: "Item saved for later." })
      }
    } catch (err: any) {
      console.error("Error toggling saved state:", err)
      toast.error("Error", { description: err?.message || "Could not update saved items." })
    }
  }

  const handleClaimClick = async () => {
    setLoadingQuestions(true)
    try {
      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .eq("item_id", item.id)

      setItemQuestions(questions || [])
      setClaimModalOpen(true)
    } catch (error) {
      console.error("Error fetching questions:", error)
      toast.error("Error", { description: "Could not load verification questions." })
    } finally {
      setLoadingQuestions(false)
    }
  }

  const imageUrl = item.image_url || "/lost-found-item.jpg"

  // Safely get user info
  const userName = item.profiles?.full_name || "Anonymous"
  const userAvatar = item.profiles?.avatar_url

  const initials = userName !== "Anonymous"
    ? userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : "?"

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border h-full flex flex-col p-0 group">
      <Link href={`/items/${item.id}`} className="block">
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Badge
            className="absolute top-3 left-3 shadow-md"
            variant={item.status === "lost" ? "destructive" : "default"}
          >
            {item.status === "lost" ? "Lost" : "Found"}
          </Badge>
          {item.reward_amount && (
            <Badge className="absolute top-3 right-3 shadow-md bg-yellow-500 hover:bg-yellow-600 text-white border-none">
              Reward: {item.currency === 'BDT' ? '৳' : '$'}{item.reward_amount}
            </Badge>
          )}
        </div>
      </Link>
      <div className="flex-1 p-5">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors flex-1 mr-4">
            <Link href={`/items/${item.id}`} className="hover:underline">
              {item.title}
            </Link>
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <button type="button" onClick={toggleSaved} className="w-full text-left flex items-center">
                  <Bookmark className="mr-2 h-4 w-4" />
                  <span>{saved ? "Remove Bookmark" : "Bookmark"}</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClaimClick} disabled={loadingQuestions}>
                {item.status === "lost" ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                <span>
                  {loadingQuestions ? "Loading..." : (item.status === "lost" ? "Mark as Found" : "Claim Item")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">
                <Shield className="mr-2 h-4 w-4" />
                <span>Report</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {item.description}
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{item.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {new Date(item.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 border-t bg-muted/30">
        <div className="flex items-center gap-3">
          <Link href={`/profile?id=${item.user_id}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
          </Link>

          <Link href={`/profile?id=${item.user_id}`}>
            <span className="text-sm font-medium hover:text-primary">{userName}</span>
          </Link>
        </div>
      </div>
      <ClaimModal
        open={claimModalOpen}
        onOpenChange={setClaimModalOpen}
        item={{
          id: item.id,
          title: item.title,
          questions: itemQuestions
        }}
      />
    </Card>
  )
}
