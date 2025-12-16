import Groq from "groq-sdk"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
    try {
        const { title, description, category, itemId, location, type } = await req.json()

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({
                questions: [
                    "What is the color of the item?",
                    "Are there any unique marks or damage on the item?",
                    "What brand or model is it?",
                ],
            })
        }

        // If itemId is provided, fetch full item details for better context
        let itemDetails = { title, description, category, location, type }

        if (itemId) {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            const { data: item } = await supabase
                .from("items")
                .select("*")
                .eq("id", itemId)
                .single()

            if (item) {
                itemDetails = {
                    title: item.title || title,
                    description: item.description || description,
                    category: item.category || category,
                    location: item.location || location,
                    type: item.type || type
                }
            }
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

        const prompt = `You are helping to generate verification questions for a lost/found item. These questions will be used to verify if someone claiming the item is the legitimate owner.

## ITEM DETAILS
- **Title**: ${itemDetails.title}
- **Description**: ${itemDetails.description || "Not provided"}
- **Category**: ${itemDetails.category || "General"}
- **Location**: ${itemDetails.location || "Not specified"}
- **Type**: ${itemDetails.type || "Unknown"} (lost or found)

## YOUR TASK
Generate 3-5 specific questions that:
1. **Only the true owner would know** - Don't ask questions answerable from the description above
2. **Are specific to this type of item** - A wallet question should be different from a phone question
3. **Test unique characteristics** - Serial numbers, hidden features, personal modifications, contents, etc.
4. **Are clear and unambiguous** - One correct answer should be obvious to the owner

## EXAMPLES BY CATEGORY
- **Electronics**: "What is the lock screen wallpaper?", "Are there any cracks or scratches? If so, where?"
- **Wallet**: "What cards are inside?", "Is there a photo in the wallet? Of whom?"
- **Keys**: "How many keys are on the keychain?", "What keychains or accessories are attached?"
- **Bags**: "What items were inside?", "Are there any stains or damage? Where?"
- **Jewelry**: "What is engraved inside?", "Any missing stones or damage?"

## REQUIRED JSON OUTPUT FORMAT
{
  "questions": [
    "Question 1 text",
    "Question 2 text",
    "Question 3 text"
  ]
}

IMPORTANT:
- Generate 3-5 questions
- Questions should be answerable in 1-2 sentences
- Avoid yes/no questions when possible
- Return ONLY valid JSON`

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert at creating verification questions for lost/found items. Your questions should be specific, fair, and only answerable by the true owner. Return valid JSON only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            response_format: { type: "json_object" }
        })

        const text = completion.choices[0]?.message?.content || "{}"

        let data
        try {
            data = JSON.parse(text)
        } catch (e) {
            console.error("Failed to parse AI response:", text)
            return NextResponse.json({
                questions: [
                    "Can you describe any unique features or damage on the item?",
                    "What was inside or attached to it?",
                    "Any distinguishing marks, engravings, or modifications?",
                ],
            })
        }

        // Ensure questions array exists
        if (!Array.isArray(data.questions) || data.questions.length === 0) {
            data.questions = [
                "Can you describe any unique features?",
                "Where exactly was it lost/found?",
                "Are there any identifying marks?",
            ]
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("AI Generate Questions Error:", error)
        return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 })
    }
}
