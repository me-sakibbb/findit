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
        <div className="flex items-start gap-6">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={match.matched_item.title}
            className="w-48 h-32 object-cover rounded-lg flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {confidencePercent}% Match
                  </Badge>
                  <Badge variant={match.matched_item.type === "lost" ? "destructive" : "default"}>
                    {match.matched_item.type === "lost" ? "Lost" : "Found"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-xl mb-1">{match.matched_item.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Potential match for: <span className="font-medium">{match.item.title}</span>
                </p>
              </div>
            </div>

            <p className="text-sm mb-4">{match.matched_item.description}</p>

            <div className="grid sm:grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{match.matched_item.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(match.matched_item.date_occurred).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-sm">
                <span className="font-medium">AI Analysis:</span> {match.reasoning}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={match.matched_item.profiles?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {match.matched_item.profiles?.full_name || "Anonymous"}
                </span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/items/${match.matched_item.id}`}>View Details</Link>
                </Button>
                <Button size="sm" asChild>
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
