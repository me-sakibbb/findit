"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export interface Notification {
    id: string
    type: string
    title: string
    message: string
    link?: string
    is_read: boolean
    created_at: string
    metadata?: any
}

export function useNotifications(userId: string | undefined) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    // Use useState initializer to create the client once and keep it stable across renders
    const [supabase] = useState(() => createBrowserClient())

    const fetchNotifications = useCallback(async () => {
        if (!userId) return

        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(20)

            if (error) throw error

            setNotifications(data || [])
            setUnreadCount(data?.filter(n => !n.is_read).length || 0)
        } catch (error) {
            console.error("Error fetching notifications:", error)
        } finally {
            setLoading(false)
        }
    }, [userId, supabase])

    const markAsRead = async (notificationId: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, is_read: true } : n
            ))
            setUnreadCount(prev => Math.max(0, prev - 1))

            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notificationId)

            if (error) throw error
        } catch (error) {
            console.error("Error marking notification as read:", error)
            // Revert on error would be ideal, but skipping for simplicity
        }
    }

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)

            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", userId)
                .eq("is_read", false)

            if (error) throw error
        } catch (error) {
            console.error("Error marking all as read:", error)
        }
    }

    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        fetchNotifications()

        const channel = supabase
            .channel(`notifications-${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, (payload) => {
                const newNotification = payload.new as Notification
                setNotifications(prev => [newNotification, ...prev])
                setUnreadCount(prev => prev + 1)

                // Play sound (simple pop sound)
                const audio = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq')
                audio.play().catch(e => console.log('Audio play failed', e))

                toast(newNotification.title, {
                    description: newNotification.message,
                    action: newNotification.link ? {
                        label: "View",
                        onClick: () => window.location.href = newNotification.link!
                    } : undefined
                })
            })
            .subscribe((status) => {
                console.log("Realtime subscription status:", status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, fetchNotifications, supabase])

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications
    }
}
