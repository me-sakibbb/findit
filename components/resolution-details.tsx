"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, ArrowRight, ExternalLink, AlertCircle } from "lucide-react"
import { useItemActions } from "@/hooks/use-item-actions"

interface ResolutionDetailsProps {
    item: any
    resolvedByClaim: any
    linkedItem: any
    currentUserId: string | null
}

export function ResolutionDetails({ item, resolvedByClaim, linkedItem, currentUserId }: ResolutionDetailsProps) {
    const { confirmResolution, updatingStatus } = useItemActions({ item, viewerUserId: currentUserId })

    const isPending = item.resolution_status === 'pending'
    const isConfirmed = item.resolution_status === 'confirmed'

    // The person who received the item (claimant)
    const recipient = resolvedByClaim?.claimant
    const recipientName = recipient?.full_name || "Unknown User"
    const recipientInitials = recipientName.split(" ").map((n: string) => n[0]).join("").toUpperCase()

    // Check if current user needs to confirm
    const needsConfirmation = isPending && currentUserId === resolvedByClaim?.claimant_id

    if (!isPending && !isConfirmed) return null

    return (
        <Card className={`border-2 ${isPending ? 'border-yellow-200 bg-yellow-50/30' : 'border-green-200 bg-green-50/30'}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        {isPending ? (
                            <>
                                <Clock className="h-6 w-6 text-yellow-600" />
                                <span className="text-yellow-700">Pending Confirmation</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <span className="text-green-700">
                                    {item.status === 'lost' ? 'Item Found' : 'Item Returned'}
                                </span>
                            </>
                        )}
                    </CardTitle>
                    {isPending && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            Action Required
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-muted-foreground">
                                {item.status === 'lost' ? 'Found by:' : 'Returned to:'}
                            </div>
                            {recipient ? (
                                <Link href={`/profile?id=${resolvedByClaim.claimant_id}`} className="flex items-center gap-2 hover:underline group">
                                    <Avatar className="h-8 w-8 border group-hover:ring-2 ring-primary/20 transition-all">
                                        <AvatarImage src={recipient.avatar_url || "/placeholder.svg"} />
                                        <AvatarFallback>{recipientInitials}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-foreground">{recipientName}</span>
                                </Link>
                            ) : (
                                <span className="font-medium text-foreground">Owner (Self-resolved)</span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                                {isPending ? 'Initiated' : 'Resolved'} on {new Date(item.resolution_initiated_at || item.resolved_at).toLocaleDateString()}
                            </span>
                        </div>

                        {linkedItem && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Linked Post:</span>
                                <Link href={`/items/${linkedItem.id}`} className="flex items-center gap-1 text-primary hover:underline font-medium">
                                    {linkedItem.title}
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {needsConfirmation && (
                        <div className="w-full md:w-auto p-4 bg-background rounded-lg border shadow-sm space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold">Did you receive this item?</h4>
                                    <p className="text-sm text-muted-foreground">
                                        The owner has marked this item as returned to you. Please confirm to close this case.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={confirmResolution}
                                disabled={updatingStatus}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                                {updatingStatus ? "Confirming..." : "Yes, I have it"}
                            </Button>
                        </div>
                    )}
                </div>

                {isPending && !needsConfirmation && (
                    <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded border border-yellow-100">
                        Waiting for {recipientName} to confirm receipt.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
