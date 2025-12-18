"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface UseItemActionsProps {
    item: any
    viewerUserId: string | null
}

export function useItemActions({ item, viewerUserId }: UseItemActionsProps) {
    const supabase = createBrowserClient()
    const router = useRouter()

    const [saved, setSaved] = useState(false)
    const [checkingSaved, setCheckingSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)
    const [reportReason, setReportReason] = useState("")
    const [submittingReport, setSubmittingReport] = useState(false)
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [deleting, setDeleting] = useState(false)

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

    return {
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
    }
}
