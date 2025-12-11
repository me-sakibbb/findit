"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  other_user: {
    id: string
    full_name: string
    avatar_url?: string
  }
  last_message: {
    content: string
    created_at: string
    sender_id: string
  }
  unread_count: number
  item?: {
    id: string
    title: string
    type: string
  }
}

interface MessageListProps {
  userId: string
  activeThreadId?: string
}

export function MessageList({ userId, activeThreadId }: MessageListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadConversations()

    // Subscribe to new messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          loadConversations()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const loadConversations = async () => {
    try {
      // Get all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from("messages")
        .select(
          "*, sender:profiles!messages_sender_id_fkey1(*), receiver:profiles!messages_recipient_id_fkey1(*), item:items(*)",
        )
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading conversations:", error.message || error)
        setConversations([])
        setLoading(false)
        return
      }

      // Group by conversation (other user + item)
      const conversationMap = new Map<string, any>()

      messages?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id
        const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender
        
        // Skip if we can't determine the other user
        if (!otherUser || !otherUser.id) {
          console.warn("Skipping message with missing user data:", msg.id)
          return
        }

        const itemKey = msg.item_id || "general"
        const key = `${otherUserId}-${itemKey}`

        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            id: key,
            other_user: otherUser,
            last_message: msg,
            unread_count: msg.recipient_id === userId && !msg.is_read ? 1 : 0,
            item: msg.item,
          })
        } else {
          const conv = conversationMap.get(key)
          // Update last message if this one is newer
          if (new Date(msg.created_at) > new Date(conv.last_message.created_at)) {
            conv.last_message = msg
          }
          // Count unread
          if (msg.recipient_id === userId && !msg.is_read) {
            conv.unread_count++
          }
        }
      })

      // Convert to array and sort by most recent message
      const conversationsArray = Array.from(conversationMap.values()).sort((a, b) => {
        return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
      })

      setConversations(conversationsArray)
    } catch (error) {
      console.error("Error loading conversations:", error instanceof Error ? error.message : String(error))
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Conversations</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet</div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => {
              const initials =
                conv.other_user.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase() || "?"

              return (
                <Link
                  key={conv.id}
                  href={`/messages?thread=${conv.id}`}
                  className={cn(
                    "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors",
                    activeThreadId === conv.id && "bg-muted",
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.other_user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{conv.other_user.full_name}</p>
                      {conv.unread_count > 0 && (
                        <Badge variant="default" className="h-5 min-w-5 px-1 text-xs">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    {conv.item && <p className="text-xs text-muted-foreground mb-1 truncate">Re: {conv.item.title}</p>}
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message.content}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
