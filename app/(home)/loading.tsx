import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="min-h-screen">
            {/* Hero Section Skeleton */}
            <section className="relative overflow-hidden">
                <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative">
                    <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
                        <Skeleton className="h-8 w-64 rounded-full mb-6" />
                        <Skeleton className="h-12 md:h-16 w-3/4 mb-6" />
                        <Skeleton className="h-12 md:h-16 w-1/2 mb-10" />
                        <Skeleton className="h-6 w-2/3 mb-10" />
                        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                            <Skeleton className="h-12 w-40" />
                            <Skeleton className="h-12 w-40" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Items Section Skeleton */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12 flex flex-col items-center">
                        <Skeleton className="h-10 w-64 mb-4" />
                        <Skeleton className="h-6 w-96" />
                    </div>
                    <div className="flex gap-4 overflow-hidden justify-center">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="w-64 h-48 rounded-xl flex-shrink-0" />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
