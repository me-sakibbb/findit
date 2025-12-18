"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClaimModal } from "@/components/claim-modal"
import { ClaimDetailsModal } from "@/components/claim-details-modal"
import { Bookmark, ExternalLink, MapPin, Share2, ShieldAlert, Sparkles, UserRoundSearch, CheckCircle2, RotateCcw, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

type Question = {
  id: string
  question_text: string
  correct_answer?: string | null
}

type Claim = {
  id: string
  answers: Record<string, string>
  ai_verdict: string
  ai_analysis?: string | null
  ai_question_analysis?: Record<string, { status: string; score?: number; explanation: string }> | null
  status: string
  created_at: string
  claimant?: {
    full_name: string | null
    email: string | null
  } | null
}

type Item = {
  id: string
  user_id: string | null
  status: string
  title: string
  description: string
  category: string
  location: string
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  date: string
  image_url: string | null
  ai_tags: string[] | null
  is_active: boolean | null
}

interface ItemDetailClientProps {
  item: Item
  viewerUserId: string | null
  isOwner: boolean
  questions: Question[]
  claims: Claim[]
}

export function ItemDetailClient({ item, viewerUserId, isOwner, questions, claims }: ItemDetailClientProps) {
  const supabase = useMemo(() => createBrowserClient(), [])
  const router = useRouter()

  const [saved, setSaved] = useState(false)
  const [checkingSaved, setCheckingSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const [claimModalOpen, setClaimModalOpen] = useState(false)

  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [submittingReport, setSubmittingReport] = useState(false)

  const [claimDetailsOpen, setClaimDetailsOpen] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const locationLabel = useMemo(() => {
    if (item.city && item.state) return `${item.city}, ${item.state}`
    return item.location || "Not specified"
  }, [item.city, item.state, item.location])

  const checkSaved = useCallback(async () => {
    if (!viewerUserId) {
      setSaved(false)
      return
    }

    setCheckingSaved(true)
    try {
      const { data } = await supabase
        .from("saved_items")
        .select("id")
        .eq("user_id", viewerUserId)
        .eq("item_id", item.id)
        .maybeSingle()

      setSaved(!!data)
    } catch (err) {
      console.error("[ItemDetail] Error checking saved state:", err)
    } finally {
      setCheckingSaved(false)
    }
  }, [item.id, supabase, viewerUserId])

  useEffect(() => {
    checkSaved()
  }, [checkSaved])

  const toggleSaved = async () => {
    if (!viewerUserId) {
      toast.error("Sign in required", { description: "Please sign in to save items." })
      return
    }

    setSaving(true)
    try {
      if (saved) {
        const { error } = await supabase.from("saved_items").delete().eq("user_id", viewerUserId).eq("item_id", item.id)
        if (error) throw error
        setSaved(false)
        toast.success("Removed", { description: "Item removed from saved items." })
      } else {
        const { error } = await supabase.from("saved_items").insert({ user_id: viewerUserId, item_id: item.id })
        if (error) throw error
        setSaved(true)
        toast.success("Saved", { description: "Item saved for later." })
      }
    } catch (err: any) {
      console.error("[ItemDetail] Error toggling saved state:", err)
      toast.error("Error", { description: err?.message || "Could not update saved items." })
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : ""

      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: `Check this ${item.status === "lost" ? "lost" : "found"} item on FindIt: ${item.title}`,
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)
      toast.success("Link copied", { description: "Item link copied to clipboard." })
    } catch (err) {
      console.error("[ItemDetail] Share failed:", err)
      toast.error("Could not share", { description: "Copy the link from the address bar." })
    }
  }

  const openClaimDetails = (claim: Claim) => {
    setSelectedClaim(claim)
    setClaimDetailsOpen(true)
  }

  const submitReport = async () => {
    if (!viewerUserId) {
      toast.error("Sign in required", { description: "Please sign in to report items." })
      return
    }

    if (!reportReason.trim()) {
      toast.error("Missing reason", { description: "Please describe why you’re reporting this item." })
      return
    }

    setSubmittingReport(true)
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: viewerUserId,
        recipient_id: item.user_id || viewerUserId,
        item_id: item.id,
        content: `REPORT: ${reportReason.trim()}`,
        message_type: "system",
        is_read: false,
        metadata: { type: "report" },
      })

      if (error) throw error

      toast.success("Report submitted", { description: "Thanks — our team will review it." })
      setReportOpen(false)
      setReportReason("")
    } catch (err: any) {
      console.error("[ItemDetail] Report failed:", err)
      toast.error("Report failed", { description: err?.message || "Please try again." })
    } finally {
      setSubmittingReport(false)
    }
  }

  const toggleItemStatus = async () => {
    setUpdatingStatus(true)
    try {
      const newStatus = item.is_active === false ? true : false
      const { error } = await supabase
        .from("items")
        .update({ is_active: newStatus })
        .eq("id", item.id)

      if (error) throw error

      toast.success("Status updated", {
        description: newStatus
          ? "Item is now active and visible in search."
          : `Item marked as ${item.status === "lost" ? "found" : "returned"}.`
      })

      // Refresh the page to show new status
      router.refresh()
      setResolveDialogOpen(false)
    } catch (err: any) {
      console.error("[ItemDetail] Status update failed:", err)
      toast.error("Update failed", { description: err?.message || "Could not update item status." })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const deleteItem = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", item.id)

      if (error) throw error

      toast.success("Item deleted", { description: "Your item has been permanently removed." })
      router.push("/profile")
    } catch (err: any) {
      console.error("[ItemDetail] Delete failed:", err)
      toast.error("Delete failed", { description: err?.message || "Could not delete item." })
    } finally {
      setDeleting(false)
    }
  }

  const mapHref = useMemo(() => {
    if (!item.latitude || !item.longitude) return null
    const lat = item.latitude
    const lng = item.longitude
    return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=16/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`
  }, [item.latitude, item.longitude])

  const nearbyHref = useMemo(() => {
    if (!item.latitude || !item.longitude) return null
    const lat = item.latitude
    const lng = item.longitude
    return `/search?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=5&type=all`
  }, [item.latitude, item.longitude])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {/* Quick Actions Row */}
        <div className="flex gap-2 mb-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant={saved ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={toggleSaved}
            disabled={checkingSaved || saving}
          >
            <Bookmark className="h-4 w-4" />
            {saved ? "Saved" : "Save"}
          </Button>
        </div>

        <div className="grid gap-3">
          {!isOwner && (
            <Button
              size="lg"
              className="w-full font-semibold text-base shadow-sm h-12"
              onClick={() => setClaimModalOpen(true)}
              disabled={!viewerUserId || !item.user_id}
            >
              {item.status === "lost" ? "I Found This" : "Claim This Item"}
            </Button>
          )}

          {isOwner && (
            <>
              {item.is_active !== false ? (
                <Button
                  variant="outline"
                  className="w-full border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-900 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                  onClick={() => setResolveDialogOpen(true)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as {item.status === "lost" ? "Found" : "Returned"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setResolveDialogOpen(true)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Mark as Active
                </Button>
              )}

              {claims.length > 0 && (
                <div className="grid gap-2 mt-2">
                  <p className="text-sm text-muted-foreground">You have {claims.length} claim(s) on this item.</p>
                  <div className="grid gap-2">
                    {claims.slice(0, 3).map((c) => (
                      <Button key={c.id} variant="outline" className="justify-between" onClick={() => openClaimDetails(c)}>
                        <span className="truncate">{c.claimant?.full_name || "Claimant"}</span>
                        <span className="text-xs text-muted-foreground">{c.ai_verdict ? `${c.ai_verdict}%` : "—"}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Item
              </Button>
            </>
          )}

          {!isOwner && (
            <Button variant="outline" onClick={() => setReportOpen(true)} className="justify-start">
              <ShieldAlert className="mr-2 h-4 w-4" />
              Report item
            </Button>
          )}

          {mapHref && (
            <Button variant="outline" asChild className="justify-start">
              <a href={mapHref} target="_blank" rel="noreferrer">
                <MapPin className="mr-2 h-4 w-4" />
                Open location map
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
          )}

          {nearbyHref && (
            <Button variant="outline" asChild className="justify-start">
              <Link href={nearbyHref}>
                <UserRoundSearch className="mr-2 h-4 w-4" />
                See items nearby
              </Link>
            </Button>
          )}

          <div className="rounded-lg border p-3 text-sm text-muted-foreground">
            <div className="font-medium text-foreground mb-1">Privacy note</div>
            Contact happens through in-app messages. Avoid sharing sensitive info. Prefer public meetups.
          </div>
        </div>

        {item.ai_tags && item.ai_tags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">AI Tags</p>
            <div className="flex flex-wrap gap-2">
              {item.ai_tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Location:</span> {locationLabel}
        </div>
      </div>

      <AlertDialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {item.is_active !== false ? "Mark as Resolved?" : "Reactivate Item?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {item.is_active !== false
                ? `This will mark the item as ${item.status === "lost" ? "found" : "returned"} and hide it from search results.`
                : "This will make the item visible in search results again."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={toggleItemStatus} disabled={updatingStatus}>
              {updatingStatus ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your item and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ClaimModal
        open={claimModalOpen}
        onOpenChange={setClaimModalOpen}
        item={{
          id: item.id,
          title: item.title,
          questions: questions.map((q) => ({ id: q.id, question_text: q.question_text })),
        }}
      />

      {selectedClaim && (
        <ClaimDetailsModal
          open={claimDetailsOpen}
          onOpenChange={setClaimDetailsOpen}
          claim={selectedClaim as any}
          questions={questions as any}
        />
      )}

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Report this item</DialogTitle>
            <DialogDescription>
              Describe what’s wrong (spam, scam, inappropriate content, duplicate, etc.). Reports are private.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Write a short reason..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)} disabled={submittingReport}>
              Cancel
            </Button>
            <Button onClick={submitReport} disabled={submittingReport}>
              {submittingReport ? "Submitting..." : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
