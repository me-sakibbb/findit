"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, ShieldCheck, Upload, X, Image, Link, Sparkles, FileText } from "lucide-react"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { sendNotification } from "@/lib/notifications"
import useAuth from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"

interface Question {
    id: string
    question_text: string
}

interface UserPost {
    id: string
    title: string
    image_url: string | null
    date: string
    is_potential_match?: boolean
    match_score?: number
}

interface ClaimModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: {
        id: string
        title: string
        questions?: Question[]
    }
}

export function ClaimModal({ open, onOpenChange, item }: ClaimModalProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [photos, setPhotos] = useState<string[]>([])
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [linkedPostId, setLinkedPostId] = useState("")
    const [userPosts, setUserPosts] = useState<UserPost[]>([])
    const [loadingPosts, setLoadingPosts] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const { getUserInfo } = useAuth()

    // Fetch user's lost posts when modal opens
    useEffect(() => {
        if (!open) return

        const fetchUserPosts = async () => {
            setLoadingPosts(true)
            try {
                const supabase = createBrowserClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) return

                // Fetch user's lost posts
                const { data: posts } = await supabase
                    .from("items")
                    .select("id, title, image_url, date")
                    .eq("user_id", user.id)
                    .eq("status", "lost")
                    .eq("is_active", true)
                    .order("created_at", { ascending: false })
                    .limit(10)

                // Fetch potential matches for this found item
                const { data: matches } = await supabase
                    .from("potential_matches")
                    .select("lost_item_id, match_score")
                    .eq("found_item_id", item.id)

                const matchMap = new Map(
                    matches?.map(m => [m.lost_item_id, m.match_score]) || []
                )

                // Mark posts that are potential matches and sort them first
                const postsWithMatches: UserPost[] = (posts || []).map(p => ({
                    ...p,
                    is_potential_match: matchMap.has(p.id),
                    match_score: matchMap.get(p.id)
                }))

                // Sort: potential matches first, then by match score
                postsWithMatches.sort((a, b) => {
                    if (a.is_potential_match && !b.is_potential_match) return -1
                    if (!a.is_potential_match && b.is_potential_match) return 1
                    return (b.match_score || 0) - (a.match_score || 0)
                })

                setUserPosts(postsWithMatches)
            } catch (error) {
                console.error("Error fetching user posts:", error)
            } finally {
                setLoadingPosts(false)
            }
        }

        fetchUserPosts()
    }, [open, item.id])

    const handleAnswerChange = (questionId: string, value: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }))
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploadingPhoto(true)
        try {
            const supabase = createBrowserClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error("Sign in required")
                return
            }

            // Dynamic import of compression
            const { compressImage } = await import("@/lib/image-utils")

            for (const file of Array.from(files)) {
                if (!file.type.startsWith("image/")) {
                    toast.error("Invalid file", { description: "Please upload images only" })
                    continue
                }

                // Compress before upload
                const compressedFile = await compressImage(file)

                const fileExt = compressedFile.name.split(".").pop() || "jpg"
                const fileName = `claims/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                const { data, error } = await supabase.storage
                    .from("item-images")
                    .upload(fileName, compressedFile, {
                        contentType: compressedFile.type,
                        upsert: false
                    })

                if (error) {
                    console.error("Upload error:", error)
                    toast.error("Upload failed")
                    continue
                }

                const { data: { publicUrl } } = supabase.storage
                    .from("item-images")
                    .getPublicUrl(data.path)

                setPhotos(prev => [...prev, publicUrl])
            }

            toast.success("Photos uploaded")
        } catch (error) {
            console.error("Photo upload error:", error)
            toast.error("Upload failed")
        } finally {
            setUploadingPhoto(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        // Validate answers
        if (item.questions && item.questions.length > 0) {
            const missingAnswers = item.questions.some((q) => !answers[q.id] || !answers[q.id].trim())
            if (missingAnswers) {
                toast.error("Missing answers", { description: "Please answer all questions to verify ownership." })
                return
            }
        }

        setSubmitting(true)
        try {
            const supabase = createBrowserClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                toast.error("Sign in required")
                return
            }

            // 1. Create Claim with photos and linked post
            const { data: claim, error: claimError } = await supabase
                .from("claims")
                .insert({
                    item_id: item.id,
                    claimant_id: user.id,
                    answers: answers,
                    ai_verdict: "0",
                    ai_analysis: "AI verification in progress...",
                    ai_question_analysis: {},
                    status: "pending",
                    claim_photos: photos,
                    linked_lost_post_id: linkedPostId.trim() || null
                })
                .select()
                .single()

            if (claimError) throw claimError

            // 2. Trigger AI verification with photos (fire-and-forget)
            void supabase.functions.invoke('verify-claim-ai', {
                body: {
                    claim_id: claim.id,
                    item_id: item.id,
                    questions: item.questions || [],
                    answers,
                    claim_photos: photos,
                    linked_lost_post_id: linkedPostId.trim() || null
                }
            })

            // 3. Also trigger photo verification if photos were uploaded
            if (photos.length > 0) {
                void supabase.functions.invoke('verify-claim-photos', {
                    body: {
                        claim_id: claim.id,
                        photo_urls: photos
                    }
                })
            }

            // 4. Create Message and send notification
            const { data: fullItem } = await supabase.from("items").select("user_id").eq("id", item.id).single()

            if (fullItem) {
                const { error: msgError } = await supabase.from("messages").insert({
                    sender_id: user.id,
                    recipient_id: fullItem.user_id,
                    item_id: item.id,
                    content: photos.length > 0
                        ? `I have claimed this item with ${photos.length} photo(s) as evidence.`
                        : "I have claimed this item.",
                    message_type: "claim",
                    is_read: false
                })

                if (msgError) console.error("Error sending claim message:", msgError)

                const userProfile = await getUserInfo()
                const claimerName = userProfile?.full_name || "Someone"

                await sendNotification({
                    userId: fullItem.user_id,
                    type: "claim",
                    title: "New Claim",
                    message: `${claimerName} claimed your item: ${item.title}`,
                    link: `/items/${item.id}`,
                    metadata: { itemId: item.id, claimId: claim.id }
                })
            }

            toast.success("Claim submitted", { description: "The owner has been notified." })
            onOpenChange(false)
            router.push("/messages")

        } catch (error) {
            console.error("Error submitting claim:", error)
            toast.error("Submission failed", { description: "Please try again." })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Claim Item: {item.title}</DialogTitle>
                    <DialogDescription>
                        To verify ownership, answer the questions below and optionally upload photos as evidence.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    {/* Questions Section */}
                    {item.questions && item.questions.length > 0 ? (
                        <div className="space-y-4">
                            <Label className="text-sm font-medium">Verification Questions</Label>
                            {item.questions.map((q) => (
                                <div key={q.id} className="space-y-2">
                                    <Label className="text-sm">{q.question_text}</Label>
                                    <Input
                                        placeholder="Your answer..."
                                        value={answers[q.id] || ""}
                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No specific verification questions. You can proceed to claim and contact the finder.
                        </p>
                    )}

                    {/* Photo Upload Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Image className="h-4 w-4" />
                                Upload Evidence Photos (Optional)
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto}
                            >
                                {uploadingPhoto ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                    <Upload className="h-4 w-4 mr-1" />
                                )}
                                Add Photos
                            </Button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />
                        <p className="text-xs text-muted-foreground">
                            Upload real photos of yourself with the item or proof of ownership. AI will verify authenticity.
                        </p>

                        {photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {photos.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Evidence ${index + 1}`}
                                            className="w-full h-20 object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index)}
                                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Link Lost Post Section */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            Link Your Lost Post (Optional)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            If you posted a lost item for this, linking it strengthens your claim.
                        </p>

                        {loadingPosts ? (
                            <div className="flex items-center gap-2 p-4 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Loading your lost posts...</span>
                            </div>
                        ) : userPosts.length > 0 ? (
                            <RadioGroup
                                value={linkedPostId}
                                onValueChange={setLinkedPostId}
                                className="space-y-2 max-h-56 overflow-y-auto"
                            >
                                {/* Potential Matches Section */}
                                {userPosts.some(p => p.is_potential_match) && (
                                    <>
                                        <div className="flex items-center gap-2 py-2 px-1">
                                            <Sparkles className="h-4 w-4 text-amber-500" />
                                            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                Potential Matches
                                            </span>
                                        </div>
                                        {userPosts.filter(p => p.is_potential_match).map((post) => (
                                            <div
                                                key={post.id}
                                                className="flex items-center space-x-3 p-3 rounded-lg border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 cursor-pointer transition-all hover:shadow-md"
                                            >
                                                <RadioGroupItem value={post.id} id={post.id} />
                                                <Label htmlFor={post.id} className="flex-1 cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        {post.image_url && (
                                                            <img
                                                                src={post.image_url}
                                                                alt=""
                                                                className="w-12 h-12 rounded-lg object-cover shrink-0 ring-2 ring-amber-300"
                                                            />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold text-sm">{post.title}</span>
                                                                <Badge className="shrink-0 bg-amber-500 text-white border-none">
                                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                                    {post.match_score}% Match
                                                                </Badge>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(post.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Label>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Divider if both sections exist */}
                                {userPosts.some(p => p.is_potential_match) && userPosts.some(p => !p.is_potential_match) && (
                                    <div className="flex items-center gap-2 py-2 px-1 mt-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Your Other Lost Posts
                                        </span>
                                    </div>
                                )}

                                {/* Regular Posts */}
                                {userPosts.filter(p => !p.is_potential_match).map((post) => (
                                    <div
                                        key={post.id}
                                        className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50"
                                    >
                                        <RadioGroupItem value={post.id} id={post.id} />
                                        <Label htmlFor={post.id} className="flex-1 cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                {post.image_url && (
                                                    <img
                                                        src={post.image_url}
                                                        alt=""
                                                        className="w-10 h-10 rounded object-cover shrink-0"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-medium text-sm line-clamp-1">{post.title}</span>
                                                    <span className="text-xs text-muted-foreground block">
                                                        {new Date(post.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                ))}

                                {/* Option for no linked post */}
                                <div className="flex items-center space-x-3 p-3 rounded-lg border border-dashed hover:bg-muted/50 cursor-pointer mt-2">
                                    <RadioGroupItem value="" id="no-link" />
                                    <Label htmlFor="no-link" className="flex-1 cursor-pointer text-muted-foreground">
                                        Don't link any post
                                    </Label>
                                </div>
                            </RadioGroup>
                        ) : (
                            <div className="flex items-center gap-2 p-4 text-muted-foreground bg-muted/30 rounded-lg">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">No active lost posts found.</span>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Submit Claim
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
