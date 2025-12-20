"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

interface MatchedItem {
    id: string
    title: string
    description: string
    status: "lost" | "found"
    category: string
    location: string
    city: string | null
    state: string | null
    date: string
    image_url: string | null
    user_id: string
    profiles?: {
        full_name: string
        avatar_url: string | null
    }
}

interface PotentialMatch {
    id: string
    item_id: string
    matched_item_id: string
    confidence_score: number
    reasoning: string | null
    is_dismissed: boolean
    created_at: string
    matched_item: MatchedItem
}

interface UsePotentialMatchesProps {
    itemId: string
}

export function usePotentialMatches({ itemId }: UsePotentialMatchesProps) {
    const [matches, setMatches] = useState<PotentialMatch[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()

    const fetchMatches = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("potential_matches")
                .select(`
                    *,
                    matched_item:items!potential_matches_matched_item_id_fkey (
                        id,
                        title,
                        description,
                        status,
                        category,
                        location,
                        city,
                        state,
                        date,
                        image_url,
                        user_id,
                        profiles:user_id (
                            full_name,
                            avatar_url
                        )
                    )
                `)
                .eq("item_id", itemId)
                .eq("is_dismissed", false)
                .order("confidence_score", { ascending: false })

            if (error) {
                console.error("Error fetching matches:", error)
            } else {
                setMatches((data as unknown as PotentialMatch[]) || [])
            }
        } catch (error) {
            console.error("Error fetching matches:", error)
        } finally {
            setLoading(false)
        }
    }, [itemId, supabase])

    const dismissMatch = async (matchId: string) => {
        const { error } = await supabase
            .from("potential_matches")
            .update({ is_dismissed: true })
            .eq("id", matchId)

        if (!error) {
            setMatches(matches.filter(m => m.id !== matchId))
        }
        return !error
    }

    useEffect(() => {
        fetchMatches()
    }, [fetchMatches])

    return {
        matches,
        loading,
        refetch: fetchMatches,
        dismissMatch
    }
}
