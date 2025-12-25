"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useMessageList } from "@/hooks/use-messages"

interface MessageListProps {
  userId: string
  activeThreadId?: string
}

export function MessageList({ userId, activeThreadId }: MessageListProps) {
  const router = useRouter()
  const { conversations, loading } = useMessageList(userId)
  const [filter, setFilter] = useState<"all" | "claims">("all")

  const filteredConversations = conversations.filter(conv => {
    if (filter === "claims") return conv.has_claim
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-2">No messages yet</p>
          <p className="text-sm text-muted-foreground text-center">
            Start a conversation from an item page or user profile
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="flex-1"
        >
          All
        </Button>
        <Button
          variant={filter === "claims" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("claims")}
          className="flex-1"
        >
          <ShieldCheck className="w-4 h-4 mr-2" />
          Claims
        </Button>
      </div>

      <div className="space-y-2">
        {filteredConversations.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No conversations found.</p>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeThreadId === conv.id
            const initials = conv.other_user.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()

            return (
              <Card
                key={conv.id}
                onClick={() => router.push(`/messages?thread=${conv.id}`)}
                className={cn(
                  "transition-colors hover:bg-muted/50 cursor-pointer",
                  isActive ? "bg-muted border-primary" : "",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/profile?id=${conv.other_user.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Avatar className="h-12 w-12 hover:ring-2 hover:ring-primary/50 transition-all">
                          <AvatarImage src={conv.other_user.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                      </Link>
                      {conv.item && conv.item.image_url && (
                        <>
                          <div className="h-3 w-3 rounded-full bg-teal-100 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                          </div>
                          <Link
                            href={`/items/${conv.item.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="h-12 w-12 rounded-lg border-2 border-teal-100 overflow-hidden bg-white shadow-sm hover:ring-2 hover:ring-primary/50 transition-all">
                              <img src={conv.item.image_url} alt="Item" className="w-full h-full object-cover" />
                            </div>
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-semibold truncate">{conv.other_user.full_name}</h4>
                          {conv.has_claim && (
                            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {new Date(conv.last_message.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {conv.item && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-100">
                            {conv.item.type === "lost" ? "Lost" : "Found"}
                          </Badge>
                          <span className="text-xs text-teal-700 font-medium truncate">{conv.item.title}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground truncate pr-2">
                          {conv.last_message.sender_id === userId ? "You: " : ""}
                          {conv.last_message.content}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center rounded-full">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
