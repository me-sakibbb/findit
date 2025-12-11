import Link from "next/link"
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
    profiles?: {
      full_name?: string | null
      avatar_url?: string | null
    } | null
  }
}



export function ItemCard({ item }: ItemCardProps) {
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
              <DropdownMenuItem>
                <Bookmark className="mr-2 h-4 w-4" />
                <span>Bookmark</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                {item.status === "lost" ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                <span>{item.status === "lost" ? "Mark as Found" : "Claim Item"}</span>
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
    </Card>
  )
}
