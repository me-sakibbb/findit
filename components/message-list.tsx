"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useMessageList } from "@/hooks/use-messages"

interface MessageListProps {
  userId: string
  activeThreadId?: string
}

export function MessageList({ userId, activeThreadId }: MessageListProps) {
  const { conversations, loading } = useMessageList(userId)

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
    <div className="space-y-2">
      {conversations.map((conv) => {
        const isActive = activeThreadId === conv.id
        const initials = conv.other_user.full_name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()

        return (
          <Link key={conv.id} href={`/messages?thread=${conv.id}`}>
            <Card
              className={cn(
                "transition-colors hover:bg-muted/50 cursor-pointer",
                isActive ? "bg-muted border-primary" : "",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={conv.other_user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold truncate">{conv.other_user.full_name}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {new Date(conv.last_message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {conv.item && (
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {conv.item.type === "lost" ? "Lost" : "Found"}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">{conv.item.title}</span>
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
          </Link>
        )
      })}
    </div>
  )
}
