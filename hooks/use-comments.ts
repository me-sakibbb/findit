"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { sendNotification } from "@/lib/notifications"

export interface Comment {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles?: {
        full_name: string
        avatar_url: string
    }
}

interface UseCommentsProps {
    itemId: string
    itemOwnerId: string
    currentUserId: string | null
    pageSize?: number
}

export function useComments({ itemId, itemOwnerId, currentUserId, pageSize = 10 }: UseCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const supabase = createBrowserClient()

    const fetchComments = useCallback(async (isLoadMore = false) => {
        try {
            if (!isLoadMore) setLoading(true)
            else setLoadingMore(true)

            let query = supabase
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
                .limit(pageSize)

            // If loading more, fetch comments older than the last one
            if (isLoadMore && comments.length > 0) {
                const lastComment = comments[comments.length - 1]
                query = query.lt("created_at", lastComment.created_at)
            }

            const { data, error } = await query

            if (error) throw error

            const newComments = data || []

            if (isLoadMore) {
                setComments(prev => [...prev, ...newComments])
            } else {
                setComments(newComments)
            }

            // Check if we have more comments to load
            setHasMore(newComments.length === pageSize)

        } catch (error: any) {
            console.error("Error fetching comments:", error)
            if (!isLoadMore && error?.code !== '42P01') { // Ignore missing table error for initial load to avoid spam
                toast.error("Failed to load comments")
            }
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [itemId, supabase, pageSize, comments])

    // Initial load
    useEffect(() => {
        fetchComments()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel(`comments-${itemId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `item_id=eq.${itemId}`
            }, (payload) => {
                // For simplicity, we just reload the first page on any change
                // A more optimized approach would be to insert/update/delete locally
                if (payload.eventType === 'INSERT') {
                    // Fetch just the new comment to add it to the top
                    // But for now, re-fetching is safer to get the profile relation
                    fetchComments()
                } else if (payload.eventType === 'DELETE') {
                    setComments(prev => prev.filter(c => c.id !== payload.old.id))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [itemId, supabase, fetchComments])

    const addComment = async (content: string) => {
        if (!content.trim()) return
        if (!currentUserId) {
            toast.error("Please sign in to comment")
            return
        }

        setSubmitting(true)
        try {
            const { error } = await supabase
                .from("comments")
                .insert({
                    content: content.trim(),
                    item_id: itemId,
                    user_id: currentUserId
                })

            if (error) throw error

            toast.success("Comment posted")

            // Send notification to item owner if it's not the commenter
            if (itemOwnerId && itemOwnerId !== currentUserId) {
                await sendNotification({
                    userId: itemOwnerId,
                    type: "comment",
                    title: "New Comment",
                    message: "Someone commented on your item.",
                    link: `/items/${itemId}`,
                    metadata: { itemId, commentContent: content.trim() }
                })
            }

        } catch (error) {
            console.error("Error posting comment:", error)
            toast.error("Failed to post comment")
        } finally {
            setSubmitting(false)
        }
    }

    const deleteComment = async (commentId: string) => {
        try {
            const { error } = await supabase
                .from("comments")
                .delete()
                .eq("id", commentId)
                .eq("user_id", currentUserId)

            if (error) throw error

            toast.success("Comment deleted")
            // Real-time subscription will handle the update locally too
        } catch (error) {
            console.error("Error deleting comment:", error)
            toast.error("Failed to delete comment")
        }
    }

    return {
        comments,
        loading,
        loadingMore,
        hasMore,
        submitting,
        loadMore: () => fetchComments(true),
        addComment,
        deleteComment
    }
}
