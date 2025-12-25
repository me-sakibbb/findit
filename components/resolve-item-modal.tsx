"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, UserCheck, Link2, Search } from "lucide-react"
import Link from "next/link"

interface Claim {
    id: string
    claimant_id?: string
    ai_verdict: string
    created_at: string
    claimant?: {
        full_name: string | null
        email: string | null
        avatar_url?: string | null
    } | null
}

interface ResolveItemModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: {
        id: string
        title: string
        status: string
    }
    claims: Claim[]
}

export function ResolveItemModal({ open, onOpenChange, item, claims }: ResolveItemModalProps) {
    const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
    const [linkedItemId, setLinkedItemId] = useState("")
    const [resolving, setResolving] = useState(false)
    const [searchingItem, setSearchingItem] = useState(false)
    const [linkedItemTitle, setLinkedItemTitle] = useState<string | null>(null)
    const router = useRouter()

    const handleSearchLinkedItem = async () => {
        if (!linkedItemId.trim()) return

        setSearchingItem(true)
        try {
            const supabase = createBrowserClient()
            const { data } = await supabase
                .from("items")
                .select("id, title")
                .eq("id", linkedItemId.trim())
                .single()

            if (data) {
                setLinkedItemTitle(data.title)
            } else {
                setLinkedItemTitle(null)
                toast.error("Item not found", { description: "No item found with that ID." })
            }
        } catch {
            setLinkedItemTitle(null)
        } finally {
            setSearchingItem(false)
        }
    }

    const handleResolve = async () => {
        setResolving(true)
        try {
            const supabase = createBrowserClient()

            // Update item as resolved
            const updateData: any = {
                is_active: false,
                resolved_at: new Date().toISOString()
            }

            if (selectedClaimId) {
                updateData.resolved_by_claim_id = selectedClaimId
            }

            if (linkedItemId.trim()) {
                updateData.linked_item_id = linkedItemId.trim()
            }

            const { error: itemError } = await supabase
                .from("items")
                .update(updateData)
                .eq("id", item.id)

            if (itemError) throw itemError

            // Mark selected claim as the owner
            if (selectedClaimId) {
                const { error: claimError } = await supabase
                    .from("claims")
                    .update({
                        is_selected_owner: true,
                        status: 'approved'
                    })
                    .eq("id", selectedClaimId)

                if (claimError) {
                    console.error("Failed to update claim:", claimError)
                }
            }

            toast.success("Item resolved!", {
                description: `Marked as ${item.status === "lost" ? "found" : "returned"} successfully.`
            })

            onOpenChange(false)
            router.refresh()
        } catch (error: any) {
            console.error("Resolve error:", error)
            toast.error("Failed to resolve", { description: error?.message || "Please try again." })
        } finally {
            setResolving(false)
        }
    }

    const getMatchColor = (percentage: number) => {
        if (percentage >= 80) return "text-green-600 bg-green-50 border-green-200"
        if (percentage >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200"
        return "text-red-600 bg-red-50 border-red-200"
    }

    const getProgressColor = (percentage: number) => {
        if (percentage >= 80) return "bg-green-500"
        if (percentage >= 60) return "bg-yellow-500"
        return "bg-red-500"
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Mark as {item.status === "lost" ? "Found" : "Returned"}
                    </DialogTitle>
                    <DialogDescription>
                        {claims.length > 0
                            ? "Select the person who claimed this item correctly, or mark as resolved without selecting anyone."
                            : "Mark this item as resolved. No claims have been submitted yet."
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4">
                    {/* Claimant Selection */}
                    {claims.length > 0 && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Who is the rightful owner?</Label>
                            <RadioGroup value={selectedClaimId || ""} onValueChange={setSelectedClaimId}>
                                {claims.map((claim) => {
                                    const matchPercentage = parseInt(claim.ai_verdict) || 0
                                    const initials = claim.claimant?.full_name
                                        ?.split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase() || "?"

                                    return (
                                        <div key={claim.id} className="relative">
                                            <RadioGroupItem
                                                value={claim.id}
                                                id={claim.id}
                                                className="peer sr-only"
                                            />
                                            <Label
                                                htmlFor={claim.id}
                                                className="flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                                            >
                                                <Link href={`/profile?id=${claim.claimant_id}`} onClick={(e) => e.stopPropagation()}>
                                                    <Avatar className="h-12 w-12 hover:ring-2 hover:ring-primary/50 transition-all">
                                                        <AvatarImage src={claim.claimant?.avatar_url || "/placeholder.svg"} />
                                                        <AvatarFallback>{initials}</AvatarFallback>
                                                    </Avatar>
                                                </Link>
                                                <div className="flex-1">
                                                    <Link
                                                        href={`/profile?id=${claim.claimant_id}`}
                                                        className="font-medium hover:text-primary transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {claim.claimant?.full_name || "Anonymous"}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground">
                                                        Claimed {new Date(claim.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge variant="outline" className={`${getMatchColor(matchPercentage)}`}>
                                                        {matchPercentage}% match
                                                    </Badge>
                                                    <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${getProgressColor(matchPercentage)}`}
                                                            style={{ width: `${matchPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    )
                                })}

                                {/* Option for no specific owner */}
                                <div className="relative">
                                    <RadioGroupItem
                                        value="none"
                                        id="none"
                                        className="peer sr-only"
                                    />
                                    <Label
                                        htmlFor="none"
                                        className="flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                                        onClick={() => setSelectedClaimId(null)}
                                    >
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <UserCheck className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">No specific claimant</p>
                                            <p className="text-xs text-muted-foreground">
                                                Resolved through other means
                                            </p>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {/* Link to another item */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Link2 className="h-4 w-4" />
                            Link to related post (optional)
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter item ID to link..."
                                value={linkedItemId}
                                onChange={(e) => {
                                    setLinkedItemId(e.target.value)
                                    setLinkedItemTitle(null)
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleSearchLinkedItem}
                                disabled={searchingItem || !linkedItemId.trim()}
                            >
                                {searchingItem ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {linkedItemTitle && (
                            <p className="text-sm text-green-600 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Found: {linkedItemTitle}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Link this to a corresponding lost/found post if applicable.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={resolving}>
                        Cancel
                    </Button>
                    <Button onClick={handleResolve} disabled={resolving}>
                        {resolving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resolving...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark as {item.status === "lost" ? "Found" : "Returned"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
