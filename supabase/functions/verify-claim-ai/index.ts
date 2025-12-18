import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Groq from 'npm:groq-sdk@0.7.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { claim_id, item_id, questions, answers } = await req.json()

        if (!claim_id || !item_id) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Fetch FULL item details for better context
        const { data: item } = await supabase
            .from("items")
            .select("*")
            .eq("id", item_id)
            .single()

        if (!item) {
            return new Response(
                JSON.stringify({ error: 'Item not found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        const groqApiKey = Deno.env.get('GROQ_API_KEY')

        if (!groqApiKey) {
            // Update claim with default values if no API key
            await supabase
                .from('claims')
                .update({
                    ai_verdict: '0',
                    ai_analysis: 'AI verification unavailable (no API key).',
                    ai_question_analysis: {}
                })
                .eq('id', claim_id)

            return new Response(
                JSON.stringify({ message: 'No API key available' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const groq = new Groq({ apiKey: groqApiKey })

        // Fetch questions and correct answers from DB
        const { data: dbQuestions } = await supabase
            .from("questions")
            .select("id, question_text, correct_answer")
            .eq("item_id", item_id)

        const questionsToUse = dbQuestions && dbQuestions.length > 0 ? dbQuestions : questions

        // Build comprehensive prompt with full context
        const prompt = `You are an AI assistant helping to verify if a person claiming a lost/found item is the legitimate owner.

## ITEM DETAILS
- **Title**: ${item.title}
- **Description**: ${item.description || "Not provided"}
- **Category**: ${item.category || "Unknown"}
- **Type**: ${item.type || "Unknown"} (lost or found)
- **Location**: ${item.location || "Not specified"}
- **Date Posted**: ${item.created_at ? new Date(item.created_at).toLocaleDateString() : "Unknown"}

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
            data = {
                confidence_percentage: 50,
                analysis: "Unable to complete analysis",
                question_analysis: {}
            }
        }

        // Ensure confidence_percentage is a valid number
        if (typeof data.confidence_percentage !== 'number') {
            data.confidence_percentage = 50
        }

        // Update the claim with AI analysis results
        const { error: updateError } = await supabase
            .from('claims')
            .update({
                ai_verdict: data.confidence_percentage.toString(),
                ai_analysis: data.analysis || 'No analysis provided',
                ai_question_analysis: data.question_analysis || {}
            })
            .eq('id', claim_id)

        if (updateError) {
            console.error('Error updating claim:', updateError)
        }

        return new Response(
            JSON.stringify({ message: 'Verification completed', data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error("AI Verify Claim Error:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
