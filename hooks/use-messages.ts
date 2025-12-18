"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export interface Conversation {
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
    user_id: string
    image_url?: string | null
  }
  has_claim?: boolean
}

export interface Message {
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
  message_type?: string
}

const MESSAGES_PER_PAGE = 20

export function useMessageList(userId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

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
            unread_count: 0,
            item: msg.item,
          })
        }

        if (!msg.is_read && msg.recipient_id === userId) {
          const conv = conversationMap.get(key)
          conv.unread_count++
        }
      })

      const convs = Array.from(conversationMap.values())

      // Fetch claims for these conversations
      if (convs.length > 0) {
        const itemIds = convs.map(c => c.item?.id).filter(Boolean)

        if (itemIds.length > 0) {
          const { data: claims } = await supabase
            .from("claims")
            .select("item_id, claimant_id")
            .in("item_id", itemIds)

          if (claims) {
            convs.forEach(conv => {
              if (conv.item) {
                const hasClaim = claims.some(c => c.item_id === conv.item.id && c.claimant_id === conv.other_user.id)
                conv.has_claim = hasClaim
              }
            })
          }
        }
      }

      setConversations(convs)
    } catch (error) {
      console.error("Error processing conversations:", error)
    } finally {
      setLoading(false)
    }
  }

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

  return { conversations, loading }
}

interface UseMessageThreadProps {
  userId: string
  threadId?: string
  itemId?: string
  recipientId?: string
}

export function useMessageThread({ userId, threadId, itemId, recipientId }: UseMessageThreadProps) {
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
  const router = useRouter()

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
      toast.error("Error", { description: "Failed to load conversation" })
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
        toast.error("Error", { description: "Failed to load recipient profile" })
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
      toast.error("Error", { description: "Failed to start conversation" })
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
      toast.error("Error", { description: "No recipient specified" })
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
      toast.error("Send failed", { description: error instanceof Error ? error.message : "Failed to send message. Please try again." })
    } finally {
      setSending(false)
    }
  }

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

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    sending,
    newMessage,
    setNewMessage,
    replyingTo,
    setReplyingTo,
    recipient,
    item,
    messagesEndRef,
    messagesContainerRef,
    loadMoreMessages,
    handleSend,
  }
}
