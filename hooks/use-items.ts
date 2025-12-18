"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export interface Item {
    id: string
    title: string
    description: string
    status: "lost" | "found"
    category: string
    location: string
    city: string | null
    state: string | null
    latitude: number | null
    longitude: number | null
    date: string
    image_url: string | null
    created_at: string
    user_id: string
    is_active: boolean
    ai_tags: string[] | null
    profiles?: {
        full_name: string
        avatar_url: string
    }
}

interface UseItemsProps {
    initialItems?: Item[]
    pageSize?: number
    filters?: {
        status?: "lost" | "found" | "all"
        category?: string
        search?: string
        userId?: string
        nearby?: {
            lat: number
            lng: number
            radius: number // in km
        }
    }
}

export function useItems({ initialItems = [], pageSize = 12, filters }: UseItemsProps = {}) {
    const [items, setItems] = useState<Item[]>(initialItems)
    const [loading, setLoading] = useState(!initialItems.length)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const supabase = createBrowserClient()

    const fetchItems = useCallback(async (isLoadMore = false) => {
        try {
            if (!isLoadMore) setLoading(true)
            else setLoadingMore(true)

            let query = supabase
                .from("items")
                .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(pageSize)

            // Apply filters
            if (filters?.status && filters.status !== "all") {
                query = query.eq("status", filters.status)
            }

            if (filters?.category && filters.category !== "all") {
                query = query.eq("category", filters.category)
            }

            if (filters?.search) {
                query = query.ilike("title", `%${filters.search}%`)
            }

            if (filters?.userId) {
                // If viewing a profile, we might want to see inactive items too
                // But for now, let's stick to the base query or modify it if needed
                query = supabase
                    .from("items")
                    .select(`
            *,
            profiles:user_id (
              full_name,
              avatar_url
            )
          `)
                    .eq("user_id", filters.userId)
                    .order("created_at", { ascending: false })
                    .limit(pageSize)
            }

            // Pagination
            if (isLoadMore && items.length > 0) {
                const lastItem = items[items.length - 1]
                query = query.lt("created_at", lastItem.created_at)
            }

            // Note: Nearby filtering is complex with just Supabase client
            // Usually requires an RPC function or PostGIS. 
            // For now, we'll skip client-side nearby filtering in this basic hook
            // or assume the initial fetch handled it via server component.

            const { data, error } = await query

            if (error) throw error

            const newItems = (data as any[]) || []

            if (isLoadMore) {
                setItems(prev => [...prev, ...newItems])
            } else {
                setItems(newItems)
            }

            setHasMore(newItems.length === pageSize)

        } catch (error) {
            console.error("Error fetching items:", error)
            toast.error("Failed to load items")
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [supabase, pageSize, filters, items])

    // Only fetch on mount if no initial items provided
    useEffect(() => {
        if (initialItems.length === 0) {
            fetchItems()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return {
        items,
        loading,
        loadingMore,
        hasMore,
        loadMore: () => fetchItems(true),
        refetch: () => fetchItems(false)
    }
}
