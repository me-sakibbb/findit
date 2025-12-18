"use client"

import { useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Item {
    id: string
    title: string
    description: string
    status: "lost" | "found"
    category: string
    location: string
    date: string
    image_url: string | null
    created_at: string
    user_id: string
    is_active: boolean
    profiles?: {
        full_name: string
        avatar_url: string
    }
}

function MiniItemCard({ item }: { item: Item }) {
    return (
        <Link
            href={`/items/${item.id}`}
            className="flex-shrink-0 w-64 bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 group"
        >
            <div className="relative h-32 bg-muted">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                    </div>
                )}
                <Badge
                    className={cn(
                        "absolute top-2 left-2 text-xs",
                        item.status === "lost"
                            ? "bg-red-500/90 hover:bg-red-500"
                            : "bg-green-500/90 hover:bg-green-500"
                    )}
                >
                    {item.status === "lost" ? "Lost" : "Found"}
                </Badge>
            </div>
            <div className="p-3">
                <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {item.title}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {item.location}
                </p>
            </div>
        </Link>
    )
}

export function RecentItems() {
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const supabase = createBrowserClient()

    useEffect(() => {
        async function fetchRecentItems() {
            const { data, error } = await supabase
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
                .limit(12)

            if (!error && data) {
                setItems(data as Item[])
            }
            setLoading(false)
        }

        fetchRecentItems()
    }, [supabase])

    const updateScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
        }
    }

    useEffect(() => {
        updateScrollButtons()
        const container = scrollContainerRef.current
        if (container) {
            container.addEventListener("scroll", updateScrollButtons)
            return () => container.removeEventListener("scroll", updateScrollButtons)
        }
    }, [items])

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 280 // Slightly more than card width
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            })
        }
    }

    if (loading) {
        return (
            <div className="flex gap-4 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="w-64 h-48 rounded-xl flex-shrink-0" />
                ))}
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No items posted yet. Be the first!</p>
                <Button asChild>
                    <Link href="/post">Post an Item</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Slider container */}
            <div className="relative group">
                {/* Left arrow */}
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm transition-opacity",
                        canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    onClick={() => scroll("left")}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                {/* Scrollable container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide px-1 py-2 scroll-smooth"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {items.map((item) => (
                        <MiniItemCard key={item.id} item={item} />
                    ))}
                </div>

                {/* Right arrow */}
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm transition-opacity",
                        canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    onClick={() => scroll("right")}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {/* View More button */}
            <div className="text-center">
                <Button variant="outline" size="lg" asChild>
                    <Link href="/items">
                        View More
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    )
}
