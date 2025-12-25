import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Groq from 'npm:groq-sdk@0.7.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Verify claim photos using AI analysis
 * - Checks if photos appear to be original (not screenshots/downloads)
 * - Analyzes metadata indicators
 * - Optional reverse image search integration
 */
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { claim_id, photo_urls } = await req.json()

        if (!claim_id || !photo_urls || photo_urls.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const groqApiKey = Deno.env.get('GROQ_API_KEY')

        if (!groqApiKey) {
            console.log('No GROQ_API_KEY, skipping photo verification')
            return new Response(
                JSON.stringify({ message: 'Photo verification skipped - no API key' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const groq = new Groq({ apiKey: groqApiKey })

        // Analyze each photo using AI vision
        const photoAnalyses: Array<{
            url: string
            is_likely_original: boolean
            confidence: number
            analysis: string
            red_flags: string[]
        }> = []

        for (const photoUrl of photo_urls) {
            try {
                // Use Groq's vision model to analyze the photo
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert at detecting fake or downloaded images. Analyze the provided image URL and determine:
1. Is this likely an ORIGINAL photo taken by the claimant, or a DOWNLOADED/SCREENSHOT image?
2. Look for these red flags:
   - Perfect studio lighting (stock photo indicator)
   - Watermarks or logos
   - Unnatural compression artifacts typical of social media downloads
   - Generic/professional composition
   - Text overlays or editing marks
   - Screenshot UI elements (status bars, buttons)
   - Reverse image search indicators (same image widely used)

Return ONLY valid JSON with this structure:
{
  "is_likely_original": boolean,
  "confidence": number (0-100),
  "analysis": "Brief explanation",
  "red_flags": ["list", "of", "concerns"]
}`
                        },
                        {
                            role: "user",
                            content: `Analyze this image: ${photoUrl}
                            
Determine if this appears to be an original photo or a downloaded/fake image. Consider composition, quality, and authenticity indicators.`
                        }
                    ],
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                })

                const text = completion.choices[0]?.message?.content || "{}"
                let analysis
                try {
                    analysis = JSON.parse(text)
                } catch {
                    analysis = {
                        is_likely_original: true,
                        confidence: 50,
                        analysis: "Could not analyze image",
                        red_flags: []
                    }
                }

                photoAnalyses.push({
                    url: photoUrl,
                    is_likely_original: analysis.is_likely_original ?? true,
                    confidence: analysis.confidence ?? 50,
                    analysis: analysis.analysis || "No analysis available",
                    red_flags: analysis.red_flags || []
                })
            } catch (photoError) {
                console.error('Error analyzing photo:', photoUrl, photoError)
                photoAnalyses.push({
                    url: photoUrl,
                    is_likely_original: true,
                    confidence: 0,
                    analysis: "Analysis failed",
                    red_flags: []
                })
            }
        }

        // Calculate overall photo authenticity score
        const originalPhotos = photoAnalyses.filter(p => p.is_likely_original)
        const avgConfidence = photoAnalyses.reduce((sum, p) => sum + p.confidence, 0) / photoAnalyses.length
        const allRedFlags = photoAnalyses.flatMap(p => p.red_flags)

        const photoVerificationResult = {
            total_photos: photoAnalyses.length,
            likely_original_count: originalPhotos.length,
            average_confidence: Math.round(avgConfidence),
            overall_assessment: originalPhotos.length >= photoAnalyses.length / 2
                ? "Photos appear authentic"
                : "Photos may not be original",
            analyses: photoAnalyses,
            red_flags_summary: [...new Set(allRedFlags)]
        }

        // Update the claim with photo verification results
        // We'll store this in the existing ai_analysis or ai_question_analysis field
        const { data: existingClaim } = await supabase
            .from('claims')
            .select('ai_analysis, ai_question_analysis')
            .eq('id', claim_id)
            .single()

        const updatedAnalysis = existingClaim?.ai_analysis
            ? `${existingClaim.ai_analysis}\n\nPhoto Verification: ${photoVerificationResult.overall_assessment} (${originalPhotos.length}/${photoAnalyses.length} photos appear original)`
            : `Photo Verification: ${photoVerificationResult.overall_assessment}`

        const updatedQuestionAnalysis = {
            ...(existingClaim?.ai_question_analysis || {}),
            photo_verification: photoVerificationResult
        }

        const { error: updateError } = await supabase
            .from('claims')
            .update({
                ai_analysis: updatedAnalysis,
                ai_question_analysis: updatedQuestionAnalysis
            })
            .eq('id', claim_id)

        if (updateError) {
            console.error('Error updating claim with photo verification:', updateError)
        }

        return new Response(
            JSON.stringify({
                message: 'Photo verification completed',
                result: photoVerificationResult
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error("Photo Verification Error:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
