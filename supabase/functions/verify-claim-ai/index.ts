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

        const { claim_id, item_id, questions, answers, claim_photos, linked_lost_post_id } = await req.json()

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

        // Fetch linked lost post if provided
        let linkedPost = null
        if (linked_lost_post_id) {
            const { data: post } = await supabase
                .from("items")
                .select("*")
                .eq("id", linked_lost_post_id)
                .single()
            linkedPost = post
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

## FOUND ITEM DETAILS (The item being claimed)
- **Title**: ${item.title}
- **Description**: ${item.description || "Not provided"}
- **Category**: ${item.category || "Unknown"}
- **Type**: ${item.type || "Unknown"} (lost or found)
- **Location**: ${item.location || "Not specified"}
- **Date Posted**: ${item.created_at ? new Date(item.created_at).toLocaleDateString() : "Unknown"}
- **Image URL**: ${item.image_url || "None"}

## CLAIMANT'S EVIDENCE

### 1. Linked Lost Post
${linkedPost ? `
- **Title**: ${linkedPost.title}
- **Description**: ${linkedPost.description}
- **Date Lost**: ${linkedPost.date}
- **Location**: ${linkedPost.location}
- **Match Score**: Compare this lost post with the found item above.
` : "No linked lost post provided."}

### 2. Evidence Photos
- **Photos Provided**: ${claim_photos && claim_photos.length > 0 ? `${claim_photos.length} photos uploaded` : "No photos uploaded"}
${claim_photos && claim_photos.length > 0 ? `(Note: You cannot see the photos directly. Treat their presence as a positive signal UNLESS the claimant mentions they are "downloaded from the internet", "stock photos", or similar. If they admit to using internet photos, DISREGARD the photos entirely.)` : ""}

### 3. Verification Questions & Answers
${questionsToUse.map((q: any, index: number) => {
            const claimantAnswer = answers[q.id] || "No answer provided"
            const ownerAnswer = q.correct_answer || null
            return `
#### Question ${index + 1} (ID: ${q.id})
**Question**: ${q.question_text}
**Claimant's Answer**: "${claimantAnswer}"
${ownerAnswer ? `**Owner's Expected Answer**: "${ownerAnswer}"` : "**Owner's Expected Answer**: Not provided (use item context to evaluate)"}`
        }).join("\n")}

## YOUR TASK
Perform a holistic analysis to determine if the claimant is the owner.

1.  **Analyze Questions**:
    *   **"Very Close" is Correct**: If the answer is very close to the truth (e.g., "dark blue" vs "navy", "Tuesday" vs "Wednesday"), mark it as **"Correct"**.
    *   **"Vague" is Partially Correct**: If the answer is vague but not wrong (e.g., "some time last week"), mark it as **"Partially Correct"**.
    *   **Heuristic**: Ask yourself: *"If they were NOT the owner, would they know this detail?"* If the answer contains specific details that are hard to guess, give them full credit.
    *   **"I Don't Know"**: Treat honest admission of ignorance as neutral. **Only** if the claimant answers "I don't know" to **MORE THAN 50%** of the questions should you treat this as a negative sign.

2.  **Analyze Linked Post**: If provided, does the lost post describe the same item? (Look for matching description, location, time).

3.  **Analyze Evidence**:
    *   **Photos**: If photos are provided and NOT flagged as internet/stock photos, treat this as a strong positive signal.
    *   **Linked Post**: A matching linked post is the strongest evidence.

## REQUIRED JSON OUTPUT FORMAT
{
  "confidence_percentage": <number between 0-100>,
  "analysis": "PRIMARY VERDICT: <2-sentence clear verdict>\n\nELABORATION: <Detailed elaboration incorporating insights from questions, linked post, and evidence.>",
  "question_analysis": {
    "<question_id>": {
      "status": "Correct" | "Partially Correct" | "Incorrect",
      "score": <0-100>,
      "explanation": "<Brief explanation>"
    }
  },
  "linked_post_analysis": {
    "status": "Strong Match" | "Possible Match" | "Weak Match" | "No Match" | "Not Provided",
    "explanation": "<Specific data-driven analysis of how the linked post matches the found item.>"
  },
  "evidence_analysis": {
    "status": "Strong" | "Moderate" | "Weak" | "None",
    "explanation": "<Specific evaluation of the provided evidence (photos). If photos are present, analyze their authenticity and relevance.>"
  }
}

IMPORTANT:
- **Primary Verdict**: The first two lines of "analysis" MUST be a clear, high-level verdict.
- **Elaboration**: Use the rest of the "analysis" to explain the reasoning in detail.
- **Prioritize Leniency**: Err on the side of believing the claimant unless there is clear evidence of fraud.
- If a linked post is a strong match, significantly boost the confidence score.
- **CRITICAL**: If the claimant mentions photos are from the internet, ignore the photos and lower confidence if that was their main evidence.
- Return ONLY valid JSON.`

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert at analyzing claim verifications for lost/found items. You return accurate, fair assessments in valid JSON format. You understand human memory is imperfect and are forgiving of minor details, but strict on factual contradictions."
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
        // We store the extra analysis in the ai_question_analysis JSONB column
        const fullAnalysis = {
            ...(data.question_analysis || {}),
            linked_post_analysis: data.linked_post_analysis,
            evidence_analysis: data.evidence_analysis
        }

        const { error: updateError } = await supabase
            .from('claims')
            .update({
                ai_verdict: data.confidence_percentage.toString(),
                ai_analysis: data.analysis || 'No analysis provided',
                ai_question_analysis: fullAnalysis
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
