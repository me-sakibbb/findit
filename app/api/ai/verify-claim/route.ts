import Groq from "groq-sdk"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
    try {
        const { itemId, itemTitle, questions, answers } = await req.json()

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Fetch FULL item details for better context
        const { data: item } = await supabase
            .from("items")
            .select("*")
            .eq("id", itemId)
            .single()

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({
                confidence_percentage: 0,
                analysis: "AI verification unavailable (no API key).",
                question_analysis: {}
            })
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

        // Fetch questions and correct answers from DB
        const { data: dbQuestions } = await supabase
            .from("questions")
            .select("id, question_text, correct_answer")
            .eq("item_id", itemId)

        const questionsToUse = dbQuestions && dbQuestions.length > 0 ? dbQuestions : questions

        // Build comprehensive prompt with full context
        const prompt = `You are an AI assistant helping to verify if a person claiming a lost/found item is the legitimate owner.

## ITEM DETAILS
- **Title**: ${item?.title || itemTitle}
- **Description**: ${item?.description || "Not provided"}
- **Category**: ${item?.category || "Unknown"}
- **Type**: ${item?.type || "Unknown"} (lost or found)
- **Location**: ${item?.location || "Not specified"}
- **Date Posted**: ${item?.created_at ? new Date(item.created_at).toLocaleDateString() : "Unknown"}

## VERIFICATION QUESTIONS AND ANSWERS
${questionsToUse.map((q: any, index: number) => {
            const claimantAnswer = answers[q.id] || "No answer provided"
            const ownerAnswer = q.correct_answer || null
            return `
### Question ${index + 1} (ID: ${q.id})
**Question**: ${q.question_text}
**Claimant's Answer**: "${claimantAnswer}"
${ownerAnswer ? `**Owner's Expected Answer**: "${ownerAnswer}"` : "**Owner's Expected Answer**: Not provided (use item context to evaluate)"}`
        }).join("\n")}

## YOUR TASK
Analyze each answer carefully:

1. **If the owner provided an expected answer**: Compare semantically (allow for phrasing differences, synonyms, abbreviations). 
   - "Yes, front" and "Yes, front side" should be considered CORRECT.
   - "Black" and "Dark black" should be considered CORRECT.
   - Completely different answers should be INCORRECT.

2. **If no expected answer is provided**: Evaluate if the answer is plausible and consistent with the item description.

3. **Calculate an overall confidence percentage** (0-100) based on:
   - How many questions were answered correctly
   - The specificity and accuracy of the answers
   - Whether answers demonstrate genuine knowledge of the item

## REQUIRED JSON OUTPUT FORMAT
{
  "confidence_percentage": <number between 0-100>,
  "analysis": "<Brief 1-2 sentence summary of your overall assessment>",
  "question_analysis": {
    "<question_id>": {
      "status": "Correct" | "Partially Correct" | "Incorrect",
      "score": <0-100 for this specific question>,
      "explanation": "<Brief explanation of why this answer is correct/incorrect>"
    }
  }
}

IMPORTANT: 
- Use the exact question IDs provided above
- Be fair but thorough in your analysis
- "Partially Correct" means the answer has some relevant information but is incomplete or slightly off
- Return ONLY valid JSON, no additional text`

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert at analyzing claim verifications for lost/found items. You return accurate, fair assessments in valid JSON format. Be lenient with phrasing differences but strict about factual accuracy."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        })

        const text = completion.choices[0]?.message?.content || "{}"

        let data
        try {
            data = JSON.parse(text)
        } catch (e) {
            console.error("Failed to parse AI response:", text)
            return NextResponse.json({
                confidence_percentage: 50,
                analysis: "Unable to complete analysis",
                question_analysis: {}
            })
        }

        // Ensure confidence_percentage is a valid number
        if (typeof data.confidence_percentage !== 'number') {
            data.confidence_percentage = 50
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("AI Verify Claim Error:", error)
        return NextResponse.json({ error: "Failed to verify claim" }, { status: 500 })
    }
}
