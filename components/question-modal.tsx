"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react"

interface QuestionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    questions: { text: string; answer: string }[]
    setQuestions: (questions: { text: string; answer: string }[]) => void
    onGenerateAI: () => Promise<void>
    isGenerating: boolean
}

export function QuestionModal({
    open,
    onOpenChange,
    questions,
    setQuestions,
    onGenerateAI,
    isGenerating,
}: QuestionModalProps) {
    const [newQuestion, setNewQuestion] = useState("")
    const [newAnswer, setNewAnswer] = useState("")

    const handleAddQuestion = () => {
        if (newQuestion.trim()) {
            setQuestions([...questions, { text: newQuestion.trim(), answer: newAnswer.trim() }])
            setNewQuestion("")
            setNewAnswer("")
        }
    }

    const handleRemoveQuestion = (index: number) => {
        const newQuestions = [...questions]
        newQuestions.splice(index, 1)
        setQuestions(newQuestions)
    }

    const handleUpdateAnswer = (index: number, answer: string) => {
        const newQuestions = [...questions]
        newQuestions[index].answer = answer
        setQuestions(newQuestions)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Verification Questions</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4 flex-1 overflow-hidden flex flex-col">
                    <div className="space-y-4 border-b pb-4">
                        <Label className="text-base">Add a Question</Label>
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="question" className="text-xs text-muted-foreground">Question</Label>
                                <Input
                                    id="question"
                                    placeholder="e.g., What is the wallpaper on the lock screen?"
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="answer" className="text-xs text-muted-foreground">Correct Answer (Optional)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="answer"
                                        placeholder="e.g., A picture of a cat"
                                        value={newAnswer}
                                        onChange={(e) => setNewAnswer(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                handleAddQuestion()
                                            }
                                        }}
                                    />
                                    <Button onClick={handleAddQuestion}>Add</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onGenerateAI}
                            disabled={isGenerating}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-3 w-3" />
                                    AI Generate Questions
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                        <Label>Current Questions</Label>
                        {questions.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No questions added yet.</p>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                                <ul className="space-y-3">
                                    {questions.map((q, i) => (
                                        <li key={i} className="bg-muted p-3 rounded-md space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 font-medium text-sm">{q.text}</div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                                                    onClick={() => handleRemoveQuestion(i)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-muted-foreground shrink-0">Answer:</Label>
                                                <Input
                                                    className="h-8 text-sm bg-background"
                                                    placeholder="Set correct answer..."
                                                    value={q.answer}
                                                    onChange={(e) => handleUpdateAnswer(i, e.target.value)}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
