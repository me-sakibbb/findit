import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ItemCardProps {
  item: {
    id: string
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
    <Link href={`/items/${item.id}`} className="group">
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border h-full flex flex-col p-0">
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
        <div className="flex-1 p-5">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
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
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{userName}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
