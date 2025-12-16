import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
    try {
        const { itemId, itemTitle, questions, answers } = await req.json()

        // Fetch item description for context (optional but helpful)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: item } = await supabase.from("items").select("description, category").eq("id", itemId).single()

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return NextResponse.json({
                verdict: "pending",
                analysis: "AI verification unavailable (no key).",
            })
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

        // Fetch questions and correct answers from DB
        const { data: dbQuestions } = await supabase
            .from("questions")
            .select("id, question_text, correct_answer")
            .eq("item_id", itemId)

        const questionsToUse = dbQuestions && dbQuestions.length > 0 ? dbQuestions : questions

        const prompt = `
      You are verifying a claim for a lost/found item.
      Item: ${itemTitle}
      Description: ${item?.description}
      Category: ${item?.category}

      Questions and Answers:
      ${questionsToUse.map((q: any) => {
            const claimantAnswer = answers[q.id] || "No answer provided"
            const ownerAnswer = q.correct_answer ? `(Owner's Correct Answer: "${q.correct_answer}")` : "(No explicit correct answer provided by owner)"
            return `Q: ${q.question_text}\nClaimant Answer: "${claimantAnswer}"\n${ownerAnswer}`
        }).join("\n\n")}

      Analyze the answers. 
      1. If the owner provided a correct answer, check if the claimant's answer matches it (allow for phrasing differences).
      2. If no correct answer is provided, check if the claimant's answer is consistent with the item description.
      
      Return a JSON object with:
      - "verdict": "high_confidence", "medium_confidence", or "low_confidence"
      - "analysis": A brief explanation of why.
    `

        let result
        try {
            result = await model.generateContent(prompt)
        } catch (modelError) {
            console.warn("gemini-1.5-flash-latest failed, trying gemini-pro fallback:", modelError)
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" })
            result = await fallbackModel.generateContent(prompt)
        }

        const response = result.response
        const text = response.text()

        const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim()
        const data = JSON.parse(jsonStr)

        return NextResponse.json(data)
    } catch (error) {
        console.error("AI Verify Claim Error:", error)
        return NextResponse.json({ error: "Failed to verify claim" }, { status: 500 })
    }
}
