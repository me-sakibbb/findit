"use client"

import { createBrowserClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { useEffect, useState, useCallback, useMemo } from "react"

export interface UserProfile {
    id: string
    full_name: string
    avatar_url?: string
    [key: string]: any
}

export default function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const supabase = useMemo(() => createBrowserClient(), [])

    const getUser = useCallback(async (): Promise<User | null> => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error) throw error
            return user
        } catch (error) {
            console.error("Error fetching auth user:", error)
            return null
        }
    }, [supabase])

    const getUserInfo = useCallback(async (): Promise<UserProfile | null> => {
        try {
            const authUser = await getUser()
            if (!authUser) return null

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error("Error fetching user profile:", error)
            return null
        }
    }, [getUser, supabase])

    useEffect(() => {
        const init = async () => {
            const authUser = await getUser()
            setUser(authUser)
            setLoading(false)
        }

        init()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [getUser, supabase])

    return { user, loading, getUser, getUserInfo }
}