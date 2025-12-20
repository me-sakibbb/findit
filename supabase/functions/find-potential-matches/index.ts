import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Groq from 'npm:groq-sdk@0.7.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Item {
    id: string
    user_id: string
    title: string
    description: string
    category: string
    status: 'lost' | 'found'
    location: string
    city: string | null
    state: string | null
    latitude: number | null
    longitude: number | null
    date: string
    image_url: string | null
    ai_tags: string[] | null
    created_at: string
    similarity?: number
}

// Generate embedding using Jina AI
async function generateEmbedding(text: string): Promise<number[]> {
    const jinaApiKey = Deno.env.get('JINA_API_KEY')

    if (!jinaApiKey) {
        throw new Error('JINA_API_KEY not configured')
    }

    const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jinaApiKey}`
        },
        body: JSON.stringify({
            model: 'jina-embeddings-v2-base-en',
            input: [text]
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Jina API error: ${error}`)
    }

    const data = await response.json()
    return data.data[0].embedding
}

// Build text representation of item for embedding
function buildItemText(item: Item): string {
    const parts = [
        item.title,
        item.description,
        `Category: ${item.category}`,
        `Location: ${item.location}`,
    ]

    if (item.city) parts.push(`City: ${item.city}`)
    if (item.state) parts.push(`State: ${item.state}`)
    if (item.ai_tags && item.ai_tags.length > 0) {
        parts.push(`Tags: ${item.ai_tags.join(', ')}`)
    }

    return parts.join('. ')
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

        const { item_id } = await req.json()

        if (!item_id) {
            return new Response(
                JSON.stringify({ error: 'Missing item_id' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Fetch the newly created item
        const { data: item, error: itemError } = await supabase
            .from('items')
            .select('*')
            .eq('id', item_id)
            .single()

        if (itemError || !item) {
            return new Response(
                JSON.stringify({ error: 'Item not found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        // Find opposite type items (if lost, find found items and vice versa)
        const oppositeStatus = item.status === 'lost' ? 'found' : 'lost'

        // Check if Jina AI is configured
        const jinaApiKey = Deno.env.get('JINA_API_KEY')

        let candidates: Item[] = []

        if (jinaApiKey) {
            // === VECTOR SEARCH PATH (Fast, handles 1M+ items) ===
            console.log('Using vector similarity search (Jina AI)...')

            try {
                // Generate embedding for the new item
                const itemText = buildItemText(item)
                const embedding = await generateEmbedding(itemText)

                // Store the embedding in the database for future searches
                await supabase
                    .from('items')
                    .update({ embedding })
                    .eq('id', item_id)

                // Use vector similarity search to find candidates
                const { data: vectorMatches, error: vectorError } = await supabase.rpc('match_items', {
                    query_embedding: embedding,
                    match_threshold: 0.5,
                    match_count: 50,
                    opposite_status: oppositeStatus,
                    exclude_user_id: item.user_id
                })

                if (vectorError) {
                    console.error('Vector search error:', vectorError)
                } else if (vectorMatches && vectorMatches.length > 0) {
                    candidates = vectorMatches
                    console.log(`Vector search found ${candidates.length} candidates`)
                }
            } catch (embeddingError) {
                console.error('Embedding generation error:', embeddingError)
            }
        }

        // === FALLBACK: Legacy search ===
        if (candidates.length === 0) {
            console.log('Using legacy search (no vector embeddings)...')
            const { data: legacyCandidates, error: candidatesError } = await supabase
                .from('items')
                .select('*')
                .eq('status', oppositeStatus)
                .eq('is_active', true)
                .neq('user_id', item.user_id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (!candidatesError && legacyCandidates) {
                candidates = legacyCandidates
            }
        }

        if (candidates.length === 0) {
            console.log('No candidates found for matching')
            return new Response(
                JSON.stringify({ message: 'No candidates found', matches: [] }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const groqApiKey = Deno.env.get('GROQ_API_KEY')

        if (!groqApiKey) {
            console.log('No GROQ_API_KEY configured')
            return new Response(
                JSON.stringify({ message: 'AI matching not configured', matches: [] }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const groq = new Groq({ apiKey: groqApiKey })

        // Build comprehensive comparison prompt
        const prompt = `You are an expert AI system for matching lost and found items. Your task is to analyze a newly posted item and find potential matches from a list of candidates.

## NEWLY POSTED ITEM (${item.status.toUpperCase()})
- **ID**: ${item.id}
- **Title**: ${item.title}
- **Description**: ${item.description}
- **Category**: ${item.category}
- **Location**: ${item.location}${item.city ? `, ${item.city}` : ''}${item.state ? `, ${item.state}` : ''}
- **Coordinates**: ${item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'Not provided'}
- **Date**: ${item.date}
- **Image URL**: ${item.image_url || 'No image'}
- **AI Tags**: ${item.ai_tags?.join(', ') || 'None'}

## CANDIDATE ITEMS (${oppositeStatus.toUpperCase()})
${candidates.map((c: Item, i: number) => `
### Candidate ${i + 1}${c.similarity ? ` (Semantic Similarity: ${Math.round(c.similarity * 100)}%)` : ''}
- **ID**: ${c.id}
- **Title**: ${c.title}
- **Description**: ${c.description}
- **Category**: ${c.category}
- **Location**: ${c.location}${c.city ? `, ${c.city}` : ''}${c.state ? `, ${c.state}` : ''}
- **Coordinates**: ${c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : 'Not provided'}
- **Date**: ${c.date}
- **Image URL**: ${c.image_url || 'No image'}
- **AI Tags**: ${c.ai_tags?.join(', ') || 'None'}
`).join('\n')}

## MATCHING CRITERIA (in order of importance)
1. **IMAGE ANALYSIS** (HIGHEST PRIORITY)
2. **DESCRIPTION MATCH**
3. **CATEGORY MATCH**
4. **LOCATION PROXIMITY**
5. **DATE PROXIMITY**
6. **AI TAGS OVERLAP**

## OUTPUT FORMAT
Return a JSON object with an array of matches. Only include items with confidence > 40.

{
  "matches": [
    {
      "matched_item_id": "<uuid>",
      "confidence_score": <0-100>,
      "reasoning": "<Brief explanation focusing on WHY these items might be the same>"
    }
  ]
}

IMPORTANT:
- Be thorough but realistic
- ALWAYS prioritize image comparisons when available
- Confidence should reflect how likely these are the SAME item
- Provide specific reasoning for each match
- Return empty matches array if no good matches found`

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert at matching lost and found items. Analyze all provided data carefully, especially images. Return accurate confidence scores and detailed reasoning in valid JSON format."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            response_format: { type: "json_object" }
        })

        const responseText = completion.choices[0]?.message?.content || '{"matches": []}'

        let result
        try {
            result = JSON.parse(responseText)
        } catch (e) {
            console.error('Failed to parse AI response:', responseText)
            result = { matches: [] }
        }

        const matches = result.matches || []
        console.log(`Found ${matches.length} potential matches for item ${item_id}`)

        // Store matches in database
        for (const match of matches) {
            if (match.confidence_score >= 40) {
                // Insert match (item -> matched_item)
                await supabase
                    .from('potential_matches')
                    .upsert({
                        item_id: item_id,
                        matched_item_id: match.matched_item_id,
                        confidence_score: match.confidence_score,
                        reasoning: match.reasoning,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'item_id,matched_item_id'
                    })

                // Also insert reverse match (matched_item -> item)
                await supabase
                    .from('potential_matches')
                    .upsert({
                        item_id: match.matched_item_id,
                        matched_item_id: item_id,
                        confidence_score: match.confidence_score,
                        reasoning: match.reasoning,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'item_id,matched_item_id'
                    })

                // Send notifications to both users
                const { data: matchedItem } = await supabase
                    .from('items')
                    .select('user_id, title')
                    .eq('id', match.matched_item_id)
                    .single()

                if (matchedItem) {
                    // Notify the owner of the matched item
                    await supabase.from('notifications').insert({
                        user_id: matchedItem.user_id,
                        type: 'match',
                        title: 'Potential Match Found!',
                        message: `Your ${oppositeStatus} item "${matchedItem.title}" may match a ${item.status} item: "${item.title}" (${match.confidence_score}% match)`,
                        link: `/items/${match.matched_item_id}`,
                        metadata: {
                            item_id: match.matched_item_id,
                            matched_item_id: item_id,
                            confidence_score: match.confidence_score
                        }
                    })

                    // Notify the owner of the new item
                    await supabase.from('notifications').insert({
                        user_id: item.user_id,
                        type: 'match',
                        title: 'Potential Match Found!',
                        message: `Your ${item.status} item "${item.title}" may match a ${oppositeStatus} item: "${matchedItem.title}" (${match.confidence_score}% match)`,
                        link: `/items/${item_id}`,
                        metadata: {
                            item_id: item_id,
                            matched_item_id: match.matched_item_id,
                            confidence_score: match.confidence_score
                        }
                    })
                }
            }
        }

        return new Response(
            JSON.stringify({
                message: 'Matching completed',
                matches_found: matches.length,
                search_method: jinaApiKey ? 'vector' : 'legacy'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Find potential matches error:', error)
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
