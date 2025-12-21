import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="mb-8 md:mb-12">
                <Skeleton className="h-10 w-48 mb-3" />
                <Skeleton className="h-7 w-96" />
            </div>

            <div className="grid lg:grid-cols-[320px_1fr] gap-8">
                {/* Sidebar Skeleton */}
                <aside className="space-y-6">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </aside>

                {/* Items Grid Skeleton */}
                <div>
                    <div className="mb-6 flex items-center justify-between">
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex flex-col space-y-3">
                                <Skeleton className="h-[200px] w-full rounded-xl" />
                                <div className="space-y-2 p-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-[80%]" />
                                    <div className="flex gap-2 pt-2">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <Skeleton className="h-4 w-24 self-center" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
