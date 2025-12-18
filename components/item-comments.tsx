"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useComments } from "@/hooks/use-comments"

interface ItemCommentsProps {
    itemId: string
    itemOwnerId: string
    currentUserId: string | null
}

export function ItemComments({ itemId, itemOwnerId, currentUserId }: ItemCommentsProps) {
    const [newComment, setNewComment] = useState("")
    const {
        comments,
        loading,
        loadingMore,
        hasMore,
        submitting,
        loadMore,
        addComment,
        deleteComment
    } = useComments({ itemId, itemOwnerId, currentUserId })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        await addComment(newComment)
        setNewComment("")
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">Comments ({comments.length})</h3>

            {currentUserId ? (
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ask a question or share information..."
                        className="min-h-[80px]"
                    />
                    <Button type="submit" disabled={submitting || !newComment.trim()} className="self-end">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            ) : (
                <div className="bg-muted/50 p-4 rounded-lg text-center text-sm text-muted-foreground">
                    Please sign in to join the discussion.
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground italic">No comments yet. Be the first to post!</div>
                ) : (
                    <>
                        {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-4 p-4 bg-muted/30 rounded-lg group">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={comment.profiles?.avatar_url} />
                                    <AvatarFallback>{comment.profiles?.full_name?.[0] || "?"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{comment.profiles?.full_name || "Unknown User"}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {currentUserId === comment.user_id && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => deleteComment(comment.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                                </div>
                            </div>
                        ))}

                        {hasMore && (
                            <div className="text-center pt-2">
                                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load More Comments"
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
