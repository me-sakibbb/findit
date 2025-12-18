"use client"

import { useEffect } from "react"
import { ItemCard } from "@/components/item-card"
import { Button } from "@/components/ui/button"
import { Loader2, Package } from "lucide-react"
import { useItems, Item } from "@/hooks/use-items"

interface PaginatedItemListProps {
    initialItems: Item[]
    filters?: {
        status?: "lost" | "found" | "all"
        category?: string
        search?: string
        userId?: string
    }
    className?: string
}

export function PaginatedItemList({ initialItems, filters, className }: PaginatedItemListProps) {
    const { items, loading, loadingMore, hasMore, loadMore } = useItems({
        initialItems,
        pageSize: 12,
        filters
    })

    if (!loading && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                    <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No items found</h3>
                <p className="text-muted-foreground max-w-md">
                    No items matched your search criteria. Try adjusting your filters.
                </p>
            </div>
        )
    }

    return (
        <div className={className}>
            <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{items.length}</span> item(s)
                </p>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((item) => (
                    <ItemCard key={item.id} item={item} />
                ))}
            </div>

            {hasMore && (
                <div className="mt-10 text-center">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="min-w-[200px]"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading more...
                            </>
                        ) : (
                            "Load More Items"
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
