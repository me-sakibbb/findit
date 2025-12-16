import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const { title, description, category } = await req.json()

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            // Fallback mock if no key
            return NextResponse.json({
                questions: [
                    "What is the color of the item?",
                    "Where exactly did you lose it?",
                    "Is there any distinguishing mark?",
                ],
            })
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
      You are helping to generate verification questions for a lost/found item to verify ownership.
      Item: ${title}
      Description: ${description}
      Category: ${category}

      Generate  specific questions that only the true owner would likely know the answer to. 
      Avoid generic questions like "What is it?". Focus on details that might not be in the description or are specific to the item type.
      Return ONLY a JSON object with a "questions" array of strings.
    `

        let result
        try {
            result = await model.generateContent(prompt)
        } catch (modelError) {
            console.warn("gemini-2.0-flash failed, trying gemini-flash-latest fallback:", modelError)
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
            result = await fallbackModel.generateContent(prompt)
        }

        const response = result.response
        const text = response.text()

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim()

        let data;
        try {
            data = JSON.parse(jsonStr)
        } catch (e) {
            console.error("Failed to parse AI response:", text)
            // Fallback if parsing fails
            return NextResponse.json({
                questions: [
                    "Can you describe any unique features?",
                    "Where exactly was it lost/found?",
                    "When did you lose/find it?",
                ],
            })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("AI Generate Questions Error:", error)
        return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 })
    }
}
