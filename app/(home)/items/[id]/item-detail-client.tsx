"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClaimModal } from "@/components/claim-modal"
import { ClaimDetailsModal } from "@/components/claim-details-modal"
import { ShareModal } from "@/components/share-modal"
import { ResolveItemModal } from "@/components/resolve-item-modal"
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
    avatar_url?: string | null
  } | null
  claim_photos?: string[] | null
  linked_lost_post?: Item | null
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
  resolution_status?: string | null
  resolution_initiated_at?: string | null
  resolved_by_claim_id?: string | null
  linked_item_id?: string | null
}

interface ItemDetailClientProps {
  item: Item
  viewerUserId: string | null
  isOwner: boolean
  questions: Question[]
  claims: Claim[]
  userHasClaimed?: boolean
}

export function ItemDetailClient({ item, viewerUserId, isOwner, questions, claims, userHasClaimed = false }: ItemDetailClientProps) {
  const [claimModalOpen, setClaimModalOpen] = useState(false)
  const [claimDetailsOpen, setClaimDetailsOpen] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)

  const {
    saved,
    checkingSaved,
    saving,
    toggleSaved,
    handleShare,
    shareModalOpen,
    setShareModalOpen,
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
            <>
              {userHasClaimed ? (
                <div className="w-full p-4 rounded-lg bg-muted/50 border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Already Claimed</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have already submitted a claim for this item. Check your messages for updates.
                  </p>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full font-semibold text-base shadow-sm h-12"
                  onClick={() => setClaimModalOpen(true)}
                  disabled={!viewerUserId || !item.user_id}
                >
                  {item.status === "lost" ? "I Found This" : "Claim This Item"}
                </Button>
              )}
            </>
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
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Claims ({claims.length})</p>
                    {claims.length > 3 && (
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                        View all
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {claims.slice(0, 3).map((c) => {
                      const matchPercentage = c.ai_verdict ? parseInt(c.ai_verdict) : 0
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
                        <button
                          key={c.id}
                          onClick={() => openClaimDetails(c)}
                          className="w-full text-left border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                {(c.claimant?.full_name || "?").charAt(0).toUpperCase()}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {c.claimant?.full_name || "Anonymous Claimant"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(c.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            {/* Match Percentage */}
                            <div className="flex flex-col items-end gap-1">
                              <div className={`px-2 py-0.5 rounded-full border text-xs font-bold ${getMatchColor(matchPercentage)}`}>
                                {matchPercentage}%
                              </div>
                              {/* Progress bar */}
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getProgressColor(matchPercentage)} transition-all`}
                                  style={{ width: `${matchPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
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

      {/* Use enhanced modal for marking as resolved, simple dialog for reactivating */}
      {item.is_active !== false ? (
        <ResolveItemModal
          open={resolveDialogOpen}
          onOpenChange={setResolveDialogOpen}
          item={{ id: item.id, title: item.title, status: item.status }}
          claims={claims.map(c => ({
            ...c,
            claimant_id: (c as any).claimant_id,
            claimant: c.claimant ? {
              ...c.claimant,
              avatar_url: (c.claimant as any).avatar_url
            } : null
          }))}
        />
      ) : (
        <AlertDialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reactivate Item?</AlertDialogTitle>
              <AlertDialogDescription>
                This will make the item visible in search results again.
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
      )}

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

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        item={{ id: item.id, title: item.title, status: item.status }}
      />
    </div>
  )
}

