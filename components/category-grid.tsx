"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import {
    Smartphone,
    Watch,
    FileText,
    Key,
    Briefcase,
    Shirt,
    PawPrint,
    MoreHorizontal,
    Dumbbell,
    Gem,
    Package,
    LucideIcon
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
    Smartphone,
    Watch,
    FileText,
    Key,
    Briefcase,
    Shirt,
    PawPrint,
    MoreHorizontal,
    Dumbbell,
    Gem,
    Package
}

// Fallback colors based on index or hash
const colors = [
    "bg-blue-500/10 text-blue-500",
    "bg-purple-500/10 text-purple-500",
    "bg-amber-500/10 text-amber-500",
    "bg-green-500/10 text-green-500",
    "bg-rose-500/10 text-rose-500",
    "bg-cyan-500/10 text-cyan-500",
    "bg-orange-500/10 text-orange-500",
    "bg-gray-500/10 text-gray-500",
]

interface Category {
    id: string
    name: string
    slug: string
    icon: string | null
    count: number
}

export function CategoryGrid() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()

    useEffect(() => {
        async function fetchCategories() {
            try {
                const { data, error } = await supabase
                    .from('categories')
                    .select('*')
                    .order('count', { ascending: false })
                    .limit(7) // Top 7 categories

                if (error) throw error

                if (data) {
                    setCategories(data)
                }
            } catch (error) {
                console.error("Error fetching categories:", error)
                // Fallback to empty or default if needed, but for now just stop loading
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [supabase])

    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
            </div>
        )
    }

    // Combine fetched categories with "Other" if needed, or just show what we have
    // Ensure we have at least "Other" at the end if we want 8 slots
    const displayCategories = [...categories]

    // If we have fewer than 8 slots, we could add "Other" manually if it's not in the top 7
    // But for now, let's just show the top 7 + "Other" link if we want, or just the grid.
    // The user asked for "top most used 7 categories".
    // Let's add a manual "Browse All" or "Other" as the 8th item if we have 7.

    if (displayCategories.length === 7) {
        displayCategories.push({
            id: "other-link",
            name: "Other",
            slug: "other",
            icon: "MoreHorizontal",
            count: 0
        })
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {displayCategories.map((category, index) => {
                const Icon = (category.icon && iconMap[category.icon]) ? iconMap[category.icon] : Package
                const colorClass = colors[index % colors.length]

                return (
                    <Link
                        key={category.id}
                        href={`/items?category=${category.slug}`}
                        className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                    >
                        <div className={`p-4 rounded-xl ${colorClass} group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-sm text-center line-clamp-1">{category.name}</span>
                    </Link>
                )
            })}
        </div>
    )
}
