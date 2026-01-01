"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ShieldAlert, ShieldQuestion, CheckCircle2, XCircle, AlertCircle, Calendar, MapPin, ExternalLink } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

interface Question {
    id: string
    question_text: string
    correct_answer?: string
}

interface ClaimDetailsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    claim: {
        id: string
        claimant_id?: string
        answers: Record<string, string>
        ai_verdict: string
        ai_analysis?: string
        ai_question_analysis?: {
            [key: string]: any // Allow dynamic keys for questions
            evidence_analysis?: {
                status: string
                explanation: string
            }
            linked_post_analysis?: {
                status: string
                explanation: string
            }
        }
        status: string
        created_at: string
        claimant: {
            full_name: string
            email: string
        }
        claim_photos?: string[]
        linked_lost_post?: {
            id: string
            title: string
            image_url?: string
            date: string
            location?: string
            status: string
        }
    }
    questions: Question[]
}

export function ClaimDetailsModal({ open, onOpenChange, claim, questions }: ClaimDetailsModalProps) {
    if (!claim) return null

    // Parse confidence percentage from ai_verdict
    const confidencePercentage = parseInt(claim.ai_verdict) || 0

    const getConfidenceColor = (percentage: number) => {
        if (percentage >= 70) return "text-green-600"
        if (percentage >= 40) return "text-yellow-600"
        return "text-red-600"
    }

    const getConfidenceBgColor = (percentage: number) => {
        if (percentage >= 70) return "bg-green-500"
        if (percentage >= 40) return "bg-yellow-500"
        return "bg-red-500"
    }

    const getConfidenceIcon = (percentage: number) => {
        if (percentage >= 70) return <ShieldCheck className="w-6 h-6 text-green-600" />
        if (percentage >= 40) return <ShieldQuestion className="w-6 h-6 text-yellow-600" />
        return <ShieldAlert className="w-6 h-6 text-red-600" />
    }

    const getStatusIcon = (status: string) => {
        if (status === "Correct") return <CheckCircle2 className="w-4 h-4 text-green-600" />
        if (status === "Incorrect") return <XCircle className="w-4 h-4 text-red-600" />
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
    }

    const getVerdictStyles = (percentage: number) => {
        if (percentage >= 70) return {
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            text: "text-emerald-900",
        }
        if (percentage >= 40) return {
            bg: "bg-amber-50",
            border: "border-amber-100",
            text: "text-amber-900",
        }
        return {
            bg: "bg-rose-50",
            border: "border-rose-100",
            text: "text-rose-900",
        }
    }

    // Split analysis into verdict and elaboration
    // Try to find where elaboration starts if explicit labels aren't used
    let verdict = ""
    let elaboration = ""

    if (claim.ai_analysis) {
        const parts = claim.ai_analysis.split(/ELABORATION:\s*/i)
        if (parts.length > 1) {
            verdict = parts[0].replace(/^PRIMARY VERDICT:\s*/i, '').trim()
            elaboration = parts[1].trim()
        } else {
            // Fallback: First sentence or two is verdict
            // Or just split by double newline
            const blocks = claim.ai_analysis.split(/\n\s*\n/)
            if (blocks.length > 1) {
                verdict = blocks[0].replace(/^PRIMARY VERDICT:\s*/i, '').trim()
                elaboration = blocks.slice(1).join('\n\n').trim()
            } else {
                // Just one block
                verdict = claim.ai_analysis.replace(/^PRIMARY VERDICT:\s*/i, '').trim()
            }
        }
    }

    const verdictStyles = getVerdictStyles(confidencePercentage)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-3 shrink-0 pr-10">
                    <DialogTitle className="text-xl">Claim Verification</DialogTitle>
                    <DialogDescription className="mt-1">
                        AI-powered analysis of answers from {claim.claimant_id ? (
                            <Link href={`/profile?id=${claim.claimant_id}`} className="font-medium text-foreground hover:text-primary transition-colors underline">
                                {claim.claimant?.full_name || "the claimant"}
                            </Link>
                        ) : (
                            <span className="font-medium text-foreground">{claim.claimant?.full_name || "the claimant"}</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-5">
                    {/* Confidence Score Section */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {getConfidenceIcon(confidencePercentage)}
                                <div>
                                    <p className="font-semibold text-lg">Confidence Score</p>
                                    <p className="text-xs text-muted-foreground">AI-assessed likelihood of legitimate ownership</p>
                                </div>
                            </div>
                            <div className={`text-4xl font-bold ${getConfidenceColor(confidencePercentage)}`}>
                                {confidencePercentage}%
                            </div>
                        </div>

                        <Progress value={confidencePercentage} className={`h-3 ${getConfidenceBgColor(confidencePercentage)}`} />

                        {claim.ai_analysis && (
                            <div className="space-y-3 pt-2 border-t border-slate-200/60 mt-2">
                                {verdict && (
                                    <div className={`${verdictStyles.bg} p-4 rounded-lg border ${verdictStyles.border}`}>
                                        <p className={`text-base font-medium ${verdictStyles.text} leading-relaxed`}>
                                            {verdict}
                                        </p>
                                    </div>
                                )}
                                {elaboration && (
                                    <p className="text-sm text-muted-foreground leading-relaxed px-1">
                                        {elaboration}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Questions & Answers */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Question-by-Question Analysis</h3>

                        {questions?.map((q, i) => {
                            const analysis = claim.ai_question_analysis?.[q.id]
                            const isCorrect = analysis?.status === "Correct"
                            const isIncorrect = analysis?.status === "Incorrect"

                            return (
                                <div key={q.id} className={`rounded-xl border-2 overflow-hidden ${isCorrect ? "border-green-200 bg-green-50/30" :
                                    isIncorrect ? "border-red-200 bg-red-50/30" :
                                        analysis ? "border-yellow-200 bg-yellow-50/30" :
                                            "border-gray-200 bg-gray-50/30"
                                    }`}>
                                    {/* Question Header */}
                                    <div className={`px-4 py-3 flex items-center justify-between ${isCorrect ? "bg-green-100/50" :
                                        isIncorrect ? "bg-red-100/50" :
                                            analysis ? "bg-yellow-100/50" :
                                                "bg-gray-100/50"
                                        }`}>
                                        <p className="font-medium text-sm">Q{i + 1}: {q.question_text}</p>
                                        {analysis && (
                                            <Badge variant="outline" className={`gap-1 ${isCorrect ? "bg-green-100 text-green-700 border-green-300" :
                                                isIncorrect ? "bg-red-100 text-red-700 border-red-300" :
                                                    "bg-yellow-100 text-yellow-700 border-yellow-300"
                                                }`}>
                                                {getStatusIcon(analysis.status)}
                                                {analysis.status}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Answer Content */}
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Claimant's Answer</span>
                                            <div className={`mt-1.5 p-3 rounded-lg text-sm ${isCorrect ? "bg-green-100 text-green-900" :
                                                isIncorrect ? "bg-red-100 text-red-900" :
                                                    analysis ? "bg-yellow-100 text-yellow-900" :
                                                        "bg-white border"
                                                }`}>
                                                {claim.answers[q.id] || <span className="text-muted-foreground italic">No answer provided</span>}
                                            </div>
                                        </div>

                                        {/* AI Analysis Note */}
                                        {analysis?.explanation && (
                                            <div className={`flex gap-2 text-xs p-2.5 rounded-lg ${isCorrect ? "bg-green-50 text-green-700" :
                                                isIncorrect ? "bg-red-50 text-red-700" :
                                                    "bg-yellow-50 text-yellow-700"
                                                }`}>
                                                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                                                <p><span className="font-semibold">AI Analysis:</span> {analysis.explanation}</p>
                                            </div>
                                        )}

                                        {/* Owner's Answer - Only show if incorrect */}
                                        {q.correct_answer && !isCorrect && (
                                            <div className="pt-2 border-t border-dashed">
                                                <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Expected Answer</span>
                                                <div className="mt-1.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
                                                    {q.correct_answer}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Evidence & Linked Post Status */}
                    <div className="space-y-4">
                        {/* Evidence Status & Photos */}
                        <div className="bg-slate-50 border rounded-xl p-4 space-y-3 flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                                    <p className="font-semibold text-sm">Evidence Strength</p>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                    {claim.ai_question_analysis?.evidence_analysis?.status || "None"}
                                </Badge>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Photos Display */}
                                <div className="w-full md:w-1/3 shrink-0">
                                    {claim.claim_photos && claim.claim_photos.length > 0 ? (
                                        <div className={`grid gap-2 ${claim.claim_photos.length === 1 ? "grid-cols-1 h-full" : "grid-cols-2"}`}>
                                            {claim.claim_photos.map((photo, idx) => (
                                                <div key={idx} className={`relative rounded-lg overflow-hidden border bg-white shadow-sm group ${claim.claim_photos!.length === 1 ? "h-full min-h-[150px]" : "aspect-square"}`}>
                                                    <img
                                                        src={photo}
                                                        alt={`Evidence ${idx + 1}`}
                                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground italic p-3 bg-white/50 rounded border border-dashed text-center h-full flex items-center justify-center">
                                            No photos provided
                                        </div>
                                    )}
                                </div>

                                {/* Evidence Analysis Text */}
                                <div className="flex-1">
                                    {claim.ai_question_analysis?.evidence_analysis?.explanation ? (
                                        <div className="h-full">
                                            <p className="text-xs text-muted-foreground leading-relaxed bg-white/50 p-3 rounded-lg border border-dashed h-full">
                                                <span className="font-semibold text-foreground/80 block mb-1">Analysis: </span>
                                                {claim.ai_question_analysis.evidence_analysis.explanation}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground italic p-3 bg-white/50 rounded border border-dashed text-center h-full flex items-center justify-center">
                                            No analysis provided
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Linked Post Status */}
                        <div className="bg-slate-50 border rounded-xl p-4 space-y-3 flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                                    <p className="font-semibold text-sm">Linked Post Match</p>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                    {claim.ai_question_analysis?.linked_post_analysis?.status || "Not Provided"}
                                </Badge>
                            </div>

                            <div className="flex-1 flex flex-col gap-3">
                                {/* Linked Post Demo Card */}
                                {claim.linked_lost_post && (
                                    <Link href={`/items/${claim.linked_lost_post.id}`} target="_blank" className="block group/card">
                                        <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex h-20">
                                                <div className="w-20 shrink-0 bg-slate-100 relative">
                                                    {claim.linked_lost_post.image_url ? (
                                                        <img
                                                            src={claim.linked_lost_post.image_url}
                                                            alt={claim.linked_lost_post.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <ShieldQuestion className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2.5 flex flex-col justify-center min-w-0">
                                                    <h4 className="font-medium text-sm truncate group-hover/card:text-primary transition-colors">
                                                        {claim.linked_lost_post.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-0.5">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(claim.linked_lost_post.date).toLocaleDateString()}
                                                        </span>
                                                        {claim.linked_lost_post.location && (
                                                            <span className="flex items-center gap-0.5 truncate max-w-[80px]">
                                                                <MapPin className="w-3 h-3" />
                                                                {claim.linked_lost_post.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ml-auto p-2 text-slate-400">
                                                    <ExternalLink className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )}

                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {claim.ai_question_analysis?.linked_post_analysis?.explanation || (
                                        <span className="italic opacity-70">No linked lost post to evaluate.</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
