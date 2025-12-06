"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, MapPin, MoreVertical, CheckCircle, Trash2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface DashboardItemCardProps {
  item: {
    id: string
    type: string
    title: string
    description: string
    category: string
    location: string
    date_occurred: string
    images: string[]
    status: string
  }
}

export function DashboardItemCard({ item }: DashboardItemCardProps) {
  const [updating, setUpdating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const imageUrl = item.images?.[0] || "/placeholder.svg?height=200&width=300"

  const handleMarkResolved = async () => {
    setUpdating(true)
    try {
      const { error } = await supabase.from("items").update({ status: "resolved" }).eq("id", item.id)

      if (error) throw error

      toast({
        title: "Item marked as resolved",
        description: "Great! We're glad you found a match.",
      })

      router.refresh()
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Update failed",
        description: "Failed to update item status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return

    setUpdating(true)
    try {
      const { error } = await supabase.from("items").delete().eq("id", item.id)

      if (error) throw error

      toast({
        title: "Item deleted",
        description: "The item has been removed",
      })

      router.refresh()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete item",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <Badge className="absolute top-2 left-2" variant={item.type === "lost" ? "destructive" : "default"}>
            {item.type === "lost" ? "Lost" : "Found"}
          </Badge>
          {item.status === "resolved" && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              Resolved
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-6 py-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{item.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{item.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(item.date_occurred).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 py-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
          <Link href={`/items/${item.id}`}>View Details</Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={updating}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.status === "active" && (
              <DropdownMenuItem onClick={handleMarkResolved}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Resolved
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}
