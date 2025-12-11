"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Reply, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  content: string
  sender_id: string
  recipient_id: string
  created_at: string
  reply_to_id?: string | null
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

const MESSAGES_PER_PAGE = 20

export function MessageThread({ userId, threadId, itemId, recipientId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [recipient, setRecipient] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (threadId) {
      loadThread()
    } else if (recipientId) {
      startNewConversation()
    }
  }, [threadId, itemId, recipientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!threadId) {
      console.log("No threadId, skipping real-time setup")
      return
    }

    const parts = threadId.split("-")
    const otherUserId = parts.slice(0, 5).join("-")
    const threadItemId = parts.slice(5).join("-")

    console.log("Setting up real-time subscription for thread:", { threadId, otherUserId, threadItemId, currentUserId: userId })

    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload: any) => {
          console.log("🔔 Real-time: New message received:", payload.new)
          const newMsg = payload.new
          
          // Only handle messages for this conversation
          const isForThisThread =
            (newMsg.sender_id === userId && newMsg.recipient_id === otherUserId) ||
            (newMsg.sender_id === otherUserId && newMsg.recipient_id === userId)

          console.log("Real-time: Is for this thread?", isForThisThread, {
            newMsg_sender: newMsg.sender_id,
            newMsg_recipient: newMsg.recipient_id,
            currentUser: userId,
            otherUser: otherUserId
          })

          if (!isForThisThread) {
            console.log("Real-time: Not for this thread, ignoring")
            return
          }

          // Check item matches
          if (threadItemId !== "general" && newMsg.item_id !== threadItemId) {
            console.log("Real-time: Item mismatch, skipping")
            return
          }
          if (threadItemId === "general" && newMsg.item_id !== null) {
            console.log("Real-time: Expected general thread but message has item_id, skipping")
            return
          }

          console.log("Real-time: Fetching full message data for:", newMsg.id)
          // Fetch full message with sender data
          const { data: msgWithSender } = await supabase
            .from("messages")
            .select("*, sender:profiles!messages_sender_id_fkey1(*)")
            .eq("id", newMsg.id)
            .single()

          if (msgWithSender) {
            console.log("Real-time: Got full message, adding to state:", msgWithSender)
            setMessages((prev) => {
              // Check if message already exists (avoid duplicates)
              if (prev.some((msg) => msg.id === msgWithSender.id)) {
                console.log("Real-time: Message already exists, skipping duplicate")
                return prev
              }
              console.log("Real-time: Adding message to state, prev count:", prev.length)
              return [...prev, msgWithSender]
            })

            // Mark as read if it's for us
            if (newMsg.recipient_id === userId) {
              await supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id)
            }
          }
        },
      )
      .subscribe((status) => {
        console.log("📡 Real-time subscription status:", status)
      })

    return () => {
      console.log("Cleaning up real-time subscription for thread:", threadId)
      supabase.removeChannel(channel)
    }
  }, [threadId, userId, supabase])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadThread = async (initialLoad = true) => {
    if (!threadId) return

    if (initialLoad) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      // Extract other user ID and item ID from thread ID
      const parts = threadId.split("-")
      const otherUserId = parts.slice(0, 5).join("-")
      const threadItemId = parts.slice(5).join("-")

      // Load initial batch of messages (most recent)
      const queryBuilder = supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey1(*)")
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`,
        )

      // Filter by item if not "general"
      if (threadItemId !== "general") {
        queryBuilder.eq("item_id", threadItemId)
      } else {
        queryBuilder.is("item_id", null)
      }

      const { data: msgs, error } = await queryBuilder
        .order("created_at", { ascending: false })
        .limit(MESSAGES_PER_PAGE)

      if (error) {
        console.error("Error loading messages:", error)
        throw error
      }

      // Reverse to show oldest first
      const reversedMsgs = (msgs || []).reverse()
      setMessages(reversedMsgs)
      setHasMore((msgs?.length || 0) >= MESSAGES_PER_PAGE)

      // Mark messages as read
      await supabase.from("messages").update({ is_read: true }).eq("recipient_id", userId).eq("sender_id", otherUserId)

      // Load recipient info
      const { data: recipientData, error: recipientError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", otherUserId)
        .single()

      if (recipientError) {
        console.error("Error loading recipient:", recipientError)
      } else {
        setRecipient(recipientData)
      }

      // Load item if exists and not "general"
      if (threadItemId !== "general") {
        const { data: itemData, error: itemError } = await supabase
          .from("items")
          .select("*")
          .eq("id", threadItemId)
          .single()

        if (itemError) {
          console.error("Error loading item:", itemError)
        } else {
          setItem(itemData)
        }
      }
    } catch (error) {
      console.error("Error loading thread:", error)
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      })
      setMessages([])
    } finally {
      if (initialLoad) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }

  const loadMoreMessages = useCallback(async () => {
    if (!threadId || !hasMore || loadingMore) return

    setLoadingMore(true)
    try {
      const parts = threadId.split("-")
      const otherUserId = parts.slice(0, 5).join("-")
      const threadItemId = parts.slice(5).join("-")

      const oldestMessage = messages[0]
      if (!oldestMessage) return

      const queryBuilder = supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey1(*)")
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`,
        )
        .lt("created_at", oldestMessage.created_at)

      if (threadItemId !== "general") {
        queryBuilder.eq("item_id", threadItemId)
      } else {
        queryBuilder.is("item_id", null)
      }

      const { data: olderMsgs, error } = await queryBuilder
        .order("created_at", { ascending: false })
        .limit(MESSAGES_PER_PAGE)

      if (error) throw error

      if (olderMsgs && olderMsgs.length > 0) {
        const reversedMsgs = olderMsgs.reverse()
        setMessages((prev) => [...reversedMsgs, ...prev])
        setHasMore(olderMsgs.length >= MESSAGES_PER_PAGE)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error loading more messages:", error)
    } finally {
      setLoadingMore(false)
    }
  }, [threadId, userId, messages, hasMore, loadingMore, supabase])

  const startNewConversation = async () => {
    if (!recipientId) return

    setLoading(true)
    try {
      // Load recipient
      const recipientRes = await supabase.from("profiles").select("*").eq("id", recipientId).single()

      if (recipientRes.error) {
        console.error("Error loading recipient:", recipientRes.error.message)
        toast({
          title: "Error",
          description: "Failed to load recipient profile",
          variant: "destructive",
        })
      } else {
        console.log("Loaded recipient:", recipientRes.data)
        setRecipient(recipientRes.data)
      }

      // Load item if provided
      if (itemId) {
        const itemRes = await supabase.from("items").select("*").eq("id", itemId).single()
        
        if (itemRes.error) {
          console.error("Error loading item:", itemRes.error.message)
        } else {
          setItem(itemRes.data)
        }
      }
    } catch (error) {
      console.error("Error starting conversation:", error instanceof Error ? error.message : String(error))
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim()) return

    // Determine recipient ID
    let targetRecipientId = recipientId

    // If we're in an existing thread, extract recipient from threadId
    if (threadId && !recipientId) {
      const parts = threadId.split("-")
      targetRecipientId = parts.slice(0, 5).join("-")
    }

    if (!targetRecipientId) {
      toast({
        title: "Error",
        description: "No recipient specified",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      // Determine item ID
      let targetItemId = itemId

      // If we're in an existing thread with an item, extract item from threadId
      if (threadId && !itemId) {
        const parts = threadId.split("-")
        const threadItemId = parts.slice(5).join("-")
        if (threadItemId !== "general") {
          targetItemId = threadItemId
        }
      }

      const { data: newMsg, error } = await supabase
        .from("messages")
        .insert({
          sender_id: userId,
          recipient_id: targetRecipientId,
          item_id: targetItemId || null,
          content: newMessage.trim(),
          reply_to_id: replyingTo?.id || null,
        })
        .select("*, sender:profiles!messages_sender_id_fkey1(*)")
        .single()

      if (error) {
        console.error("Error inserting message:", error)
        throw error
      }
      
      setNewMessage("")
      setReplyingTo(null)

      // Add the message to the local state immediately
      if (newMsg) {
        setMessages((prev) => {
          // Check if it already exists
          if (prev.some(m => m.id === newMsg.id)) {
            return prev
          }
          return [...prev, newMsg]
        })
      }

      // If starting a new conversation, navigate to the thread using Next.js router
      if (!threadId) {
        router.push(`/messages?thread=${targetRecipientId}-${targetItemId || "general"}`)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Send failed",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
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

  // Check if we have necessary data
  if ((threadId || recipientId) && !recipient) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-2">Unable to load conversation</p>
          <p className="text-sm text-muted-foreground">The user may not exist or there was an error loading their profile.</p>
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

      <CardContent 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-400px)]"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement
          // Load more when scrolled to top
          if (target.scrollTop === 0 && hasMore && !loadingMore) {
            loadMoreMessages()
          }
        }}
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">Start the conversation by sending a message below</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = msg.sender_id === userId
              const repliedMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null
              
              return (
                <div key={msg.id} className={cn("flex gap-2 group", isOwn ? "justify-end" : "justify-start")}>
                  {!isOwn && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={msg.sender?.avatar_url || recipient?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "max-w-md rounded-lg px-4 py-2 relative",
                        isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      {repliedMsg && (
                        <div className={cn(
                          "text-xs mb-2 pb-2 border-b",
                          isOwn ? "border-primary-foreground/20" : "border-border"
                        )}>
                          <p className={cn("font-medium", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
                            Replying to {repliedMsg.sender_id === userId ? "yourself" : recipient?.full_name}
                          </p>
                          <p className={cn("truncate", isOwn ? "text-primary-foreground/60" : "text-muted-foreground/80")}>
                            {repliedMsg.content}
                          </p>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                      <p className={cn("text-xs mt-1", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {new Date(msg.created_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!isOwn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
                        onClick={() => setReplyingTo(msg)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        <span className="text-xs">Reply</span>
                      </Button>
                    )}
                  </div>
                  {isOwn && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <CardFooter className="border-t p-4 flex-col gap-2">
        {replyingTo && (
          <div className="w-full bg-muted/50 rounded-lg p-2 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Reply className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  Replying to {replyingTo.sender_id === userId ? "yourself" : recipient?.full_name}
                </p>
              </div>
              <p className="text-sm text-muted-foreground truncate">{replyingTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
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
