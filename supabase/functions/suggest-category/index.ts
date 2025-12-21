import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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

        const { record } = await req.json()

        if (!record || !record.title) {
            return new Response(
                JSON.stringify({ error: 'No record provided' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        console.log(`Processing item: ${record.id} - ${record.title}`)

        // 1. Fetch existing categories
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('name')

        if (catError) {
            console.error('Error fetching categories:', catError)
            throw catError
        }

        const existingCategories = categories.map(c => c.name).join(', ')

        // 2. Call AI to suggest category
        const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
        if (!GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set')
        }

        const prompt = `
      Analyze the following lost/found item and assign it a category.
      
      Item Title: "${record.title}"
      Item Description: "${record.description || ''}"
      
      Existing Categories: ${existingCategories}
      
      Instructions:
      1. If the item fits well into one of the existing categories, return that category name exactly.
      2. If the item clearly does NOT fit into any existing category, suggest a new, concise category name (1-2 words, Title Case).
      3. Return ONLY the category name. Do not add any explanation or punctuation.
    `

        const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that categorizes items.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 20,
            }),
        })

        const aiData = await aiResponse.json()
        let suggestedCategory = aiData.choices[0]?.message?.content?.trim()

        // Clean up response (remove quotes, periods, etc.)
        suggestedCategory = suggestedCategory.replace(/['".]/g, '')

        console.log(`AI suggested category: ${suggestedCategory}`)

        if (!suggestedCategory) {
            suggestedCategory = 'Other'
        }

        // 3. Check if category exists, if not create it
        const { data: existingCat } = await supabase
            .from('categories')
            .select('id, count')
            .ilike('name', suggestedCategory)
            .single()

        if (existingCat) {
            // Increment count
            await supabase
                .from('categories')
                .update({ count: (existingCat.count || 0) + 1 })
                .eq('id', existingCat.id)
        } else {
            // Create new category
            // Generate a simple slug
            const slug = suggestedCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')

            await supabase
                .from('categories')
                .insert({
                    name: suggestedCategory,
                    slug: slug,
                    icon: 'Package', // Default icon for new categories
                    count: 1
                })
        }

        // 4. Update the item with the category
        const { error: updateError } = await supabase
            .from('items')
            .update({ category: suggestedCategory })
            .eq('id', record.id)

        if (updateError) {
            console.error('Error updating item category:', updateError)
            throw updateError
        }

        return new Response(
            JSON.stringify({ success: true, category: suggestedCategory }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error processing category suggestion:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
