"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ShieldAlert, ShieldQuestion, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
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
        ai_question_analysis?: Record<string, { status: string, score?: number, explanation: string }>
        status: string
        created_at: string
        claimant: {
            full_name: string
            email: string
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
                            <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                                {claim.ai_analysis}
                            </p>
                        )}
                    </div>

                    {/* Questions & Answers */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Question-by-Question Analysis</h3>

                        {questions.map((q, i) => {
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
                </div>
            </DialogContent>
        </Dialog>
    )
}
