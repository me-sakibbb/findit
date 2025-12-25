"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Facebook, Twitter, MessageCircle, Mail, Link2, Copy, Check, Share2 } from "lucide-react"

interface ShareModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: {
        id: string
        title: string
        status: string
    }
}

export function ShareModal({ open, onOpenChange, item }: ShareModalProps) {
    const [copied, setCopied] = useState(false)

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/items/${item.id}`
        : ""

    const shareText = `Check out this ${item.status === "lost" ? "lost" : "found"} item on FindIt: ${item.title}`

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            toast.success("Link copied!", { description: "Item link copied to clipboard." })
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error("Failed to copy", { description: "Please copy the link manually." })
        }
    }

    const shareOptions = [
        {
            name: "Facebook",
            icon: Facebook,
            color: "bg-[#1877F2] hover:bg-[#166FE5]",
            onClick: () => {
                window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                    "_blank",
                    "width=600,height=400"
                )
            }
        },
        {
            name: "Twitter",
            icon: Twitter,
            color: "bg-[#1DA1F2] hover:bg-[#1a8cd8]",
            onClick: () => {
                window.open(
                    `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
                    "_blank",
                    "width=600,height=400"
                )
            }
        },
        {
            name: "WhatsApp",
            icon: MessageCircle,
            color: "bg-[#25D366] hover:bg-[#20BD5A]",
            onClick: () => {
                window.open(
                    `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
                    "_blank"
                )
            }
        },
        {
            name: "Email",
            icon: Mail,
            color: "bg-gray-600 hover:bg-gray-700",
            onClick: () => {
                window.location.href = `mailto:?subject=${encodeURIComponent(`FindIt: ${item.title}`)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`
            }
        }
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Share this item
                    </DialogTitle>
                    <DialogDescription>
                        Share "{item.title}" with others
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Social Share Buttons */}
                    <div className="grid grid-cols-4 gap-3">
                        {shareOptions.map((option) => (
                            <button
                                key={option.name}
                                onClick={option.onClick}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl text-white transition-all hover:scale-105 ${option.color}`}
                            >
                                <option.icon className="h-6 w-6" />
                                <span className="text-xs font-medium">{option.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Copy Link Section */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Or copy link</p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={shareUrl}
                                    readOnly
                                    className="pl-10 pr-4 bg-muted/50 text-sm"
                                />
                            </div>
                            <Button
                                onClick={handleCopyLink}
                                variant={copied ? "default" : "outline"}
                                className="shrink-0 gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
