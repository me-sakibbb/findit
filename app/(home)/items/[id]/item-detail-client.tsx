"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useItemActions } from "@/hooks/use-item-actions"

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
  const [claimModalOpen, setClaimModalOpen] = useState(false)
  const [claimDetailsOpen, setClaimDetailsOpen] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)

  const {
    saved,
    checkingSaved,
    saving,
    toggleSaved,
    handleShare,
    reportOpen,
    setReportOpen,
    reportReason,
    setReportReason,
    submittingReport,
    submitReport,
    resolveDialogOpen,
    setResolveDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    updatingStatus,
    toggleItemStatus,
    deleting,
    deleteItem
  } = useItemActions({ item, viewerUserId })

  const locationLabel = useMemo(() => {
    if (item.city && item.state) return `${item.city}, ${item.state}`
    return item.location || "Not specified"
  }, [item.city, item.state, item.location])

  const openClaimDetails = (claim: Claim) => {
    setSelectedClaim(claim)
    setClaimDetailsOpen(true)
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
