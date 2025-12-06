"use client"

import { useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  content: string
  sender_id: string
  recipient_id: string
  created_at: string
  sender?: {
    full_name: string
    avatar_url?: string
  }
}

interface MessageThreadProps {
  userId: string
  threadId?: string
  itemId?: string
  recipientId?: string
}

export function MessageThread({ userId, threadId, itemId, recipientId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [recipient, setRecipient] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    if (threadId) {
      loadThread()
    } else if (itemId && recipientId) {
      startNewConversation()
    }
  }, [threadId, itemId, recipientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadThread = async () => {
    if (!threadId) return

    setLoading(true)
    try {
      // Extract other user ID from thread ID
      const [otherUserId] = threadId.split("-")

      // Load messages between users
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(*)")
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`,
        )
        .order("created_at", { ascending: true })

      if (error) throw error

      setMessages(msgs || [])

      // Mark messages as read
      await supabase.from("messages").update({ read: true }).eq("recipient_id", userId).eq("sender_id", otherUserId)

      // Load recipient info
      const { data: recipientData } = await supabase.from("profiles").select("*").eq("id", otherUserId).single()

      setRecipient(recipientData)

      // Load item if exists
      if (msgs && msgs.length > 0 && msgs[0].item_id) {
        const { data: itemData } = await supabase.from("items").select("*").eq("id", msgs[0].item_id).single()

        setItem(itemData)
      }

      // Subscribe to new messages
      const channel = supabase
        .channel(`thread-${threadId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `sender_id=eq.${otherUserId}`,
          },
          async (payload) => {
            const { data: newMsg } = await supabase
              .from("messages")
              .select("*, sender:profiles!messages_sender_id_fkey(*)")
              .eq("id", payload.new.id)
              .single()

            if (newMsg) {
              setMessages((prev) => [...prev, newMsg])

              // Mark as read
              await supabase.from("messages").update({ read: true }).eq("id", newMsg.id)
            }
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.error("Error loading thread:", error)
    } finally {
      setLoading(false)
    }
  }

  const startNewConversation = async () => {
    if (!recipientId || !itemId) return

    setLoading(true)
    try {
      // Load recipient and item
      const [recipientRes, itemRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", recipientId).single(),
        supabase.from("items").select("*").eq("id", itemId).single(),
      ])

      setRecipient(recipientRes.data)
      setItem(itemRes.data)
    } catch (error) {
      console.error("Error starting conversation:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !recipientId) return

    setSending(true)
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        recipient_id: recipientId,
        item_id: itemId,
        content: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage("")

      if (!threadId) {
        // Redirect to the new thread
        window.location.href = `/messages?thread=${recipientId}-${itemId || "general"}`
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Send failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  if (!threadId && !recipientId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground text-center">Select a conversation or start a new one</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const initials =
    recipient?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "?"

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={recipient?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{recipient?.full_name || "User"}</CardTitle>
            {item && <p className="text-sm text-muted-foreground">Re: {item.title}</p>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === userId
          return (
            <div key={msg.id} className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}>
              {!isOwn && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.sender?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-4 py-2",
                  isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={cn("text-xs mt-1", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {new Date(msg.created_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {isOwn && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">You</AvatarFallback>
                </Avatar>
              )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="border-t p-4">
        <div className="flex gap-2 w-full">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            rows={2}
            className="resize-none"
          />
          <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
