"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Send, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Comment {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles?: {
        full_name: string
        avatar_url: string
    }
}

interface ItemCommentsProps {
    itemId: string
    currentUserId: string | null
}

export function ItemComments({ itemId, currentUserId }: ItemCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const supabase = createBrowserClient()

    const fetchComments = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("comments")
                .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
                .eq("item_id", itemId)
                .order("created_at", { ascending: false })

            if (error) throw error
            setComments(data || [])
        } catch (error: any) {
            console.error("Error fetching comments:", error)
            // Log detailed error for debugging
            console.error("Error details:", JSON.stringify(error, null, 2))

            // If the error is about the relation not existing, it means the migration hasn't been run.
            if (error?.code === '42P01') { // undefined_table
                console.warn("Comments table missing. Please run the migration.")
            }
        } finally {
            setLoading(false)
        }
    }, [itemId, supabase])

    useEffect(() => {
        fetchComments()

        // Subscribe to new comments
        const channel = supabase
            .channel('comments')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `item_id=eq.${itemId}`
            }, () => {
                fetchComments()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchComments, itemId, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return
        if (!currentUserId) {
            toast.error("Please sign in to comment")
            return
        }

        setSubmitting(true)
        try {
            const { error } = await supabase
                .from("comments")
                .insert({
                    content: newComment.trim(),
                    item_id: itemId,
                    user_id: currentUserId
                })

            if (error) throw error

            setNewComment("")
            toast.success("Comment posted")
            fetchComments()
        } catch (error) {
            console.error("Error posting comment:", error)
            toast.error("Failed to post comment")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (commentId: string) => {
        try {
            const { error } = await supabase
                .from("comments")
                .delete()
                .eq("id", commentId)
                .eq("user_id", currentUserId)

            if (error) throw error

            toast.success("Comment deleted")
            setComments(comments.filter(c => c.id !== commentId))
        } catch (error) {
            console.error("Error deleting comment:", error)
            toast.error("Failed to delete comment")
        }
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
                    comments.map((comment) => (
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
                                            onClick={() => handleDelete(comment.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
