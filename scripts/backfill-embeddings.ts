/**
 * Backfill Embeddings Script
 * 
 * Generates embeddings for existing items that don't have them.
 * Run with: npx tsx scripts/backfill-embeddings.ts
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const JINA_API_KEY = process.env.JINA_API_KEY! // Switch to JINA_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !JINA_API_KEY) {
    console.error('Missing required environment variables in .env.local (JINA_API_KEY required)')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface Item {
    id: string
    title: string
    description: string
    category: string
    location: string
    city: string | null
    state: string | null
    ai_tags: string[] | null
}

// Generate embedding using Jina AI
async function generateEmbedding(text: string, attempt = 1): Promise<number[]> {
    const MAX_ATTEMPTS = 3
    const model = 'jina-embeddings-v2-base-en'

    try {
        console.log(`📡 Sending to Jina AI (${model}): "${text.substring(0, 50)}..."`)

        const response = await fetch('https://api.jina.ai/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JINA_API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                input: [text] // Jina expects an array
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.warn(`⚠️ Attempt ${attempt} failed with ${response.status}: ${errorText}`)

            if (attempt < MAX_ATTEMPTS) {
                const delay = attempt * 2000
                console.log(`🔄 Retrying in ${delay}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
                return generateEmbedding(text, attempt + 1)
            }
            throw new Error(`Jina API error after ${MAX_ATTEMPTS} attempts: ${errorText}`)
        }

        const data = await response.json()
        if (!data.data || !data.data[0] || !data.data[0].embedding) {
            throw new Error('Invalid response format from Jina AI')
        }
        return data.data[0].embedding
    } catch (err) {
        if (attempt < MAX_ATTEMPTS) {
            const delay = attempt * 2000
            console.log(`🔄 Retrying after network error in ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            return generateEmbedding(text, attempt + 1)
        }
        throw err
    }
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

async function backfillEmbeddings() {
    console.log('🚀 Starting embeddings backfill (Jina AI)...')

    // Get count of items without embeddings
    const { count: totalCount, error: countError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .is('embedding', null)

    if (countError) {
        console.error('❌ Error counting items:', countError)
        return
    }

    console.log(`📊 Found ${totalCount} items without embeddings`)

    if (!totalCount || totalCount === 0) {
        console.log('✅ All items already have embeddings!')
        return
    }

    const BATCH_SIZE = 10
    const DELAY_MS = 1000
    let processed = 0
    let failed = 0

    while (true) {
        const { data: items, error } = await supabase
            .from('items')
            .select('id, title, description, category, location, city, state, ai_tags')
            .is('embedding', null)
            .limit(BATCH_SIZE)

        if (error) {
            console.error('❌ Error fetching items:', error)
            break
        }

        if (!items || items.length === 0) {
            break
        }

        for (const item of items) {
            try {
                const text = buildItemText(item)
                const embedding = await generateEmbedding(text)

                const { error: updateError } = await supabase
                    .from('items')
                    .update({ embedding })
                    .eq('id', item.id)

                if (updateError) {
                    console.error(`❌ Error updating item ${item.id}:`, updateError)
                    failed++
                } else {
                    processed++
                    console.log(`✅ [${processed}/${totalCount}] Processed: ${item.title.substring(0, 40)}...`)
                }
            } catch (err) {
                console.error(`❌ Error processing ${item.id}:`, err)
                failed++
            }
        }

        if (items.length < BATCH_SIZE) break
        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }

    console.log('\n📊 Backfill complete!')
    console.log(`✅ Successfully processed: ${processed}`)
    console.log(`❌ Failed: ${failed}`)
}

backfillEmbeddings()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Fatal error:', err)
        process.exit(1)
    })
