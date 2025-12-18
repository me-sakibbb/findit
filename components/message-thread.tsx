"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, Send, Reply, X, MoreVertical, ShieldCheck, User, Trash2, Ban } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMessageThread } from "@/hooks/use-messages"
import { ClaimDetailsModal } from "@/components/claim-details-modal"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface MessageThreadProps {
  userId: string
  threadId?: string
  itemId?: string
  recipientId?: string
}

export function MessageThread({ userId, threadId, itemId, recipientId }: MessageThreadProps) {
  const {
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
  } = useMessageThread({ userId, threadId, itemId, recipientId })

  const [claimModalOpen, setClaimModalOpen] = useState(false)
  const [claimData, setClaimData] = useState<any>(null)
  const [claimQuestions, setClaimQuestions] = useState<any[]>([])
  const [loadingClaim, setLoadingClaim] = useState(false)

  const handleViewClaim = async () => {
    if (!item?.id || !recipient?.id) return

    setLoadingClaim(true)
    try {
      const supabase = createBrowserClient()

      // Fetch claim (get latest if multiple)
      const { data: claim, error } = await supabase
        .from("claims")
        .select("*, claimant:profiles!claimant_id(full_name, email)")
        .eq("item_id", item.id)
        .eq("claimant_id", recipient.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) throw error

      // Fetch questions
      const { data: questions, error: qError } = await supabase
        .from("questions")
        .select("*")
        .eq("item_id", item.id)

      if (qError) throw qError

      setClaimData(claim)
      setClaimQuestions(questions || [])
      setClaimModalOpen(true)
    } catch (error) {
      console.error("Error fetching claim:", error)
      toast.error("Could not load claim details")
    } finally {
      setLoadingClaim(false)
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

  // Check if current user is the owner of the item discussed
  // Check if current user is the owner of the item discussed
  // Ensure we have both item_id and user_id before checking ownership
  const isItemOwner = Boolean(item?.id && item?.user_id && userId && String(item.user_id) === String(userId))

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar section with item indicator */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Avatar className="h-14 w-14">
                <AvatarImage src={recipient?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="text-base">{initials}</AvatarFallback>
              </Avatar>
              {item && item.image_url && (
                <>
                  <div className="h-4 w-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-teal-500" />
                  </div>
                  <div className="h-14 w-14 rounded-lg border-2 border-teal-100 overflow-hidden bg-white shadow-md">
                    <img src={item.image_url} alt="Item" className="w-full h-full object-cover" />
                  </div>
                </>
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{recipient?.full_name || "User"}</CardTitle>
              {item && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 px-2.5 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    <span className="font-medium text-teal-700 truncate max-w-[200px]">{item.title}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isItemOwner && (
              <Button
                variant="outline"
                size="sm"
                className="text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700 gap-2"
                onClick={handleViewClaim}
                disabled={loadingClaim}
              >
                {loadingClaim ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                View Claim
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Ban className="mr-2 h-4 w-4" />
                  Block User
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              const isClaimMessage = msg.message_type === 'claim'

              if (isClaimMessage) {
                return (
                  <div key={msg.id} className="flex justify-center my-4">
                    <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 max-w-sm text-center">
                      <div className="flex items-center justify-center gap-2 mb-1 text-teal-700 font-medium">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Claim Submitted</span>
                      </div>
                      <p className="text-sm text-teal-600/90">{isOwn ? "You submitted a claim for this item." : "User submitted a claim for this item."}</p>
                      <p className="text-xs text-teal-600/70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          month: "short",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                )
              }

              return (
                <div key={msg.id} className={cn("flex gap-2 group", isOwn ? "justify-end" : "justify-start")}>
                  {!isOwn && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={msg.sender?.avatar_url || recipient?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                      </Avatar>
                      {item && item.image_url && (
                        <>
                          <div className="h-2.5 w-2.5 rounded-full bg-teal-100 flex items-center justify-center">
                            <div className="h-1 w-1 rounded-full bg-teal-500" />
                          </div>
                          <div className="h-10 w-10 rounded-md border-2 border-teal-100 overflow-hidden bg-white shadow-sm">
                            <img src={item.image_url} alt="Item" className="w-full h-full object-cover" />
                          </div>
                        </>
                      )}
                    </div>
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
                    <div className="flex items-center gap-1 shrink-0">
                      {item && item.image_url && (
                        <>
                          <div className="h-10 w-10 rounded-md border-2 border-teal-100 overflow-hidden bg-white shadow-sm">
                            <img src={item.image_url} alt="Item" className="w-full h-full object-cover" />
                          </div>
                          <div className="h-2.5 w-2.5 rounded-full bg-teal-100 flex items-center justify-center">
                            <div className="h-1 w-1 rounded-full bg-teal-500" />
                          </div>
                        </>
                      )}
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm">You</AvatarFallback>
                      </Avatar>
                    </div>
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

      <ClaimDetailsModal
        open={claimModalOpen}
        onOpenChange={setClaimModalOpen}
        claim={claimData}
        questions={claimQuestions}
      />
    </Card>
  )
}
