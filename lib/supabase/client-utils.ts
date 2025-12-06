import { createBrowserClient } from "@/lib/supabase/client"
import { put } from "@vercel/blob"

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadFile(file: File): Promise<{ url: string; filename: string; size: number; type: string }> {
  try {
    const blob = await put(file.name, file, {
      access: "public",
    })

    return {
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    }
  } catch (error) {
    console.error("Upload error:", error)
    throw new Error("Failed to upload file")
  }
}

/**
 * Categorize an item using AI
 */
export async function categorizeItem(title: string, description: string) {
  // For now, use simple keyword matching
  // In production, you could use OpenAI directly from the client with edge functions
  const text = `${title} ${description}`.toLowerCase()

  const categories = {
    Electronics: ["phone", "laptop", "computer", "tablet", "camera", "headphone", "charger", "electronic"],
    Clothing: ["shirt", "pants", "jacket", "dress", "shoe", "sock", "hat", "clothes", "clothing"],
    Accessories: ["watch", "bracelet", "necklace", "sunglasses", "belt", "scarf", "tie"],
    Documents: ["id", "passport", "license", "certificate", "paper", "document", "card"],
    Keys: ["key", "keychain", "remote"],
    Bags: ["bag", "backpack", "purse", "wallet", "luggage", "suitcase"],
    Books: ["book", "notebook", "textbook", "novel", "magazine"],
    Jewelry: ["ring", "earring", "pendant", "gold", "silver", "jewelry", "jewellery"],
    "Sports Equipment": ["ball", "racket", "bicycle", "skateboard", "sports", "gym", "fitness"],
  }

  let bestCategory = "Other"
  let bestScore = 0

  for (const [category, keywords] of Object.entries(categories)) {
    const matchCount = keywords.filter((keyword) => text.includes(keyword)).length
    const score = matchCount / keywords.length

    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }

  return {
    category: bestCategory,
    confidence: Math.min(bestScore * 2, 1), // Scale up confidence
  }
}

/**
 * Find potential matches for a lost/found item
 */
export async function findMatches(itemId: string) {
  const supabase = createBrowserClient()

  // Get the source item
  const { data: sourceItem, error: sourceError } = await supabase.from("items").select("*").eq("id", itemId).single()

  if (sourceError || !sourceItem) {
    throw new Error("Item not found")
  }

  // Get opposite type items (lost finds found, found finds lost)
  const oppositeType = sourceItem.type === "lost" ? "found" : "lost"
  const { data: candidateItems, error: candidatesError } = await supabase
    .from("items")
    .select("*")
    .eq("type", oppositeType)
    .eq("status", "active")
    .neq("user_id", sourceItem.user_id)
    .limit(20)

  if (candidatesError || !candidateItems || candidateItems.length === 0) {
    return []
  }

  // Simple matching algorithm based on keywords and metadata
  const sourceKeywords = `${sourceItem.title} ${sourceItem.description} ${sourceItem.category}`.toLowerCase().split(/\s+/)

  const matches = candidateItems
    .map((candidate) => {
      const candidateKeywords =
        `${candidate.title} ${candidate.description} ${candidate.category}`.toLowerCase().split(/\s+/)

      // Calculate keyword overlap
      const overlap = sourceKeywords.filter((word) => candidateKeywords.includes(word)).length
      const keywordScore = overlap / Math.max(sourceKeywords.length, candidateKeywords.length)

      // Category match bonus
      const categoryScore = sourceItem.category === candidate.category ? 0.3 : 0

      // Date proximity (closer dates = higher score)
      const sourceDate = new Date(sourceItem.date_occurred).getTime()
      const candidateDate = new Date(candidate.date_occurred).getTime()
      const daysDiff = Math.abs(sourceDate - candidateDate) / (1000 * 60 * 60 * 24)
      const dateScore = Math.max(0, (30 - daysDiff) / 30) * 0.2 // Max 30 days

      const totalScore = keywordScore * 0.5 + categoryScore + dateScore

      return {
        item_id: itemId,
        matched_item_id: candidate.id,
        confidence_score: Math.min(totalScore, 1),
        reasoning: `Category: ${sourceItem.category === candidate.category ? "Match" : "Different"}. Keywords overlap: ${Math.round(keywordScore * 100)}%. Date difference: ${Math.round(daysDiff)} days.`,
      }
    })
    .filter((match) => match.confidence_score > 0.3)
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 5)

  // Store matches in database
  if (matches.length > 0) {
    await supabase.from("potential_matches").upsert(matches, {
      onConflict: "item_id,matched_item_id",
    })
  }

  return matches
}
