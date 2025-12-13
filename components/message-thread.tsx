"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, Reply, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMessageThread } from "@/hooks/use-messages"

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
