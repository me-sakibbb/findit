import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export default function Loading() {
    return (
        <div className="min-h-svh bg-background pb-20">
            <div className="container mx-auto px-4 py-4 max-w-6xl">
                <Skeleton className="h-9 w-32" />
            </div>

            <main className="container mx-auto px-4 max-w-6xl">
                {/* Header Section */}
                <div className="mb-6">
                    <Skeleton className="h-10 w-3/4 md:w-1/2 mb-3" />
                    <div className="flex flex-wrap items-center gap-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                </div>

                {/* Hero Image */}
                <Skeleton className="aspect-video md:aspect-[21/9] w-full rounded-2xl mb-10" />

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-[1fr_380px] gap-12">
                    {/* Left Column: Details */}
                    <div className="space-y-10">
                        {/* Posted By */}
                        <div className="flex items-center justify-between pb-8 border-b">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-14 w-14 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                            <Skeleton className="h-10 w-32" />
                        </div>

                        {/* Description */}
                        <section className="space-y-4">
                            <Skeleton className="h-7 w-40" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-8 w-32" />
                            </div>
                        </section>

                        <Separator />

                        {/* Map */}
                        <section className="space-y-4">
                            <Skeleton className="h-7 w-24" />
                            <Skeleton className="h-[300px] w-full rounded-xl" />
                        </section>
                    </div>

                    {/* Right Column: Sticky Sidebar */}
                    <div className="space-y-6">
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <Skeleton className="h-[150px] w-full rounded-xl" />
                    </div>
                </div>
            </main>
        </div>
    )
}
