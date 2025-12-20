"use client"

import { usePotentialMatches } from "@/hooks/use-potential-matches"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, MapPin, Calendar, MessageSquare, X, ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PotentialMatchesProps {
    itemId: string
    itemStatus: "lost" | "found"
}

export function PotentialMatches({ itemId, itemStatus }: PotentialMatchesProps) {
    const { matches, loading, dismissMatch } = usePotentialMatches({ itemId })

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Potential Matches
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (matches.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Potential Matches
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm text-center py-6">
                        No potential matches found yet. We'll notify you when we find items that might match yours!
                    </p>
                </CardContent>
            </Card>
        )
    }

    const oppositeStatus = itemStatus === "lost" ? "found" : "lost"

    return (
        <Card className="border-primary/20">
            <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Potential Matches ({matches.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-4">
                    {matches.map((match) => {
                        const matchedItem = match.matched_item
                        const confidence = Number(match.confidence_score)
                        const initials = matchedItem.profiles?.full_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase() || "?"

                        return (
                            <div
                                key={match.id}
                                className="relative border rounded-lg p-4 hover:border-primary/50 transition-colors"
                            >
                                {/* Dismiss button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => dismissMatch(match.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>

                                <div className="flex gap-4">
                                    {/* Image */}
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                        {matchedItem.image_url ? (
                                            <img
                                                src={matchedItem.image_url}
                                                alt={matchedItem.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-xs",
                                                    confidence >= 70
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : confidence >= 50
                                                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                )}
                                            >
                                                <Sparkles className="mr-1 h-3 w-3" />
                                                {confidence}% Match
                                            </Badge>
                                            <Badge variant={oppositeStatus === "lost" ? "destructive" : "default"} className="text-xs">
                                                {oppositeStatus === "lost" ? "Lost" : "Found"}
                                            </Badge>
                                        </div>

                                        <h4 className="font-semibold text-base mb-1 truncate pr-8">{matchedItem.title}</h4>

                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate max-w-[150px]">
                                                    {matchedItem.city && matchedItem.state
                                                        ? `${matchedItem.city}, ${matchedItem.state}`
                                                        : matchedItem.location}
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(matchedItem.date).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* AI Reasoning */}
                                        {match.reasoning && (
                                            <p className="text-[13px] text-muted-foreground mt-2.5 line-clamp-3 italic leading-snug border-l-2 border-primary/10 pl-2">
                                                "{match.reasoning}"
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/50">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                                                <Avatar className="h-6 w-6 shrink-0">
                                                    <AvatarImage src={matchedItem.profiles?.avatar_url || undefined} />
                                                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                                                </Avatar>
                                                <span className="truncate">{matchedItem.profiles?.full_name || "Anonymous"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button variant="outline" size="sm" className="h-8 px-3 text-xs" asChild>
                                                    <Link href={`/items/${matchedItem.id}`}>
                                                        <ExternalLink className="mr-1.5 h-3 w-3" />
                                                        View
                                                    </Link>
                                                </Button>
                                                <Button size="sm" className="h-8 px-3 text-xs" asChild>
                                                    <Link href={`/messages?item=${matchedItem.id}&user=${matchedItem.user_id}`}>
                                                        <MessageSquare className="mr-1.5 h-3 w-3" />
                                                        Contact
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
