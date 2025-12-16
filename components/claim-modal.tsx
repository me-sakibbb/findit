"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Question {
    id: string
    question_text: string
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
    const router = useRouter()

    const handleAnswerChange = (questionId: string, value: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }))
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

            // 1. Verify with AI
            let verdict = "pending"
            let aiResponse = null

            if (item.questions && item.questions.length > 0) {
                const verifyRes = await fetch("/api/ai/verify-claim", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        itemId: item.id,
                        itemTitle: item.title,
                        questions: item.questions,
                        answers,
                    }),
                })

                if (verifyRes.ok) {
                    aiResponse = await verifyRes.json()
                    verdict = aiResponse.verdict
                }
            }

            // 2. Create Claim
            const { data: claim, error: claimError } = await supabase
                .from("claims")
                .insert({
                    item_id: item.id,
                    claimant_id: user.id,
                    answers: answers,
                    ai_verdict: aiResponse?.analysis || "No questions provided",
                    status: "pending",
                })
                .select()
                .single()

            if (claimError) throw claimError

            // 3. Create Message
            // First check if a conversation exists
            const { data: existingConv } = await supabase
                .from("messages")
                .select("id")
                .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`) // This is a simplification, ideally we find the thread with the owner
            // Actually, we need to know the owner ID. It's not passed in props but we can assume the API handles it or we fetch it.
            // For now, let's assume the backend or a trigger handles the message, OR we do it here if we have owner_id.
            // The item object in props is partial. Let's fetch the item owner first or pass it in.

            // We'll trust the verify-claim API or just create a message if we can. 
            // Since we don't have owner_id easily here without fetching, let's do a fetch.
            const { data: fullItem } = await supabase.from("items").select("user_id").eq("id", item.id).single()

            if (fullItem) {
                const { error: msgError } = await supabase.from("messages").insert({
                    sender_id: user.id,
                    recipient_id: fullItem.user_id,
                    item_id: item.id,
                    content: `I have claimed this item. ${aiResponse?.verdict === 'high_confidence' ? 'AI Verification: High Confidence match.' : ''}`,
                    is_read: false
                })

                if (msgError) console.error("Error sending claim message:", msgError)
            }

            toast.success("Claim submitted", { description: "The owner has been notified." })
            onOpenChange(false)
            router.push("/messages") // Redirect to messages to show the thread

        } catch (error) {
            console.error("Error submitting claim:", error)
            toast.error("Submission failed", { description: "Please try again." })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Claim Item: {item.title}</DialogTitle>
                    <DialogDescription>
                        To verify you are the rightful owner, please answer the following questions set by the finder.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {item.questions && item.questions.length > 0 ? (
                        item.questions.map((q) => (
                            <div key={q.id} className="space-y-2">
                                <Label>{q.question_text}</Label>
                                <Input
                                    placeholder="Your answer..."
                                    value={answers[q.id] || ""}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No specific verification questions. You can proceed to claim and contact the finder.
                        </p>
                    )}
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
