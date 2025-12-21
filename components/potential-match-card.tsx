import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MapPin, MessageSquare, Sparkles } from "lucide-react"

interface PotentialMatchCardProps {
  match: {
    id: string
    confidence_score: number
    reasoning: string
    item: {
      id: string
      title: string
      type: string
    }
    matched_item: {
      id: string
      title: string
      description: string
      category: string
      location: string
      date_occurred: string
      images: string[]
      user_id: string
      type: string
      profiles?: {
        full_name: string
        avatar_url?: string
      }
    }
  }
}

export function PotentialMatchCard({ match }: PotentialMatchCardProps) {
  const imageUrl = match.matched_item.images?.[0] || "/placeholder.svg?height=200&width=300"
  const confidencePercent = Math.round(match.confidence_score * 100)
  const initials =
    match.matched_item.profiles?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <Link href={`/items/${match.matched_item.id}`} className="block shrink-0">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={match.matched_item.title}
              className="w-full md:w-48 h-40 md:h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
            />
          </Link>

          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="secondary">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {confidencePercent}% Match
                  </Badge>
                  <Badge variant={match.matched_item.type === "lost" ? "destructive" : "default"}>
                    {match.matched_item.type === "lost" ? "Lost" : "Found"}
                  </Badge>
                </div>
                <Link href={`/items/${match.matched_item.id}`} className="hover:text-primary transition-colors">
                  <h3 className="font-semibold text-xl mb-1">{match.matched_item.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground mb-2">
                  Potential match for: <span className="font-medium">{match.item.title}</span>
                </p>
              </div>
            </div>

            <p className="text-sm mb-4 leading-relaxed">{match.matched_item.description}</p>

            <div className="grid sm:grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{match.matched_item.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  {new Date(match.matched_item.date_occurred).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-sm leading-relaxed">
                <span className="font-medium">AI Analysis:</span> {match.reasoning}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Link href={`/profile?id=${match.matched_item.user_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={match.matched_item.profiles?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {match.matched_item.profiles?.full_name || "Anonymous"}
                </span>
              </Link>

              <div className="flex gap-3 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
                  <Link href={`/items/${match.matched_item.id}`}>View Details</Link>
                </Button>
                <Button size="sm" className="flex-1 sm:flex-none" asChild>
                  <Link href={`/messages?item=${match.matched_item.id}&user=${match.matched_item.user_id}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
