"use server"

import { createServerClient } from "@/lib/supabase/server"
import Groq from "groq-sdk"

export async function categorizeItem(title: string, description: string) {
  try {
    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error("[AI] Groq API key not configured in environment variables")
      return null
    }

    console.log("[AI] Starting categorization with Groq...")

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that categorizes lost/found items. Respond with only ONE category name."
        },
        {
          role: "user",
          content: `Based on this lost/found item, suggest the most appropriate category. Only respond with ONE of these exact categories: Electronics, Clothing, Accessories, Documents, Keys, Bags, Books, Jewelry, Sports Equipment, Other.
        
Title: ${title}
Description: ${description}

Category:`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 20
    })

    const text = completion.choices[0]?.message?.content || "Other"

    console.log("[AI] Raw response:", text)
    const category = text.trim()
    const validCategories = [
      "Electronics",
      "Clothing",
      "Accessories",
      "Documents",
      "Keys",
      "Bags",
      "Books",
      "Jewelry",
      "Sports Equipment",
      "Other",
    ]

    const finalCategory = validCategories.includes(category) ? category : "Other"
    console.log("[AI] Final category:", finalCategory)

    return {
      category: finalCategory,
      confidence: 0.85,
    }
  } catch (error: any) {
    console.error("[AI] Categorization error:", error)
    console.error("[AI] Error message:", error?.message)
    return null
  }
}

export async function findMatches(itemId: string) {
  try {
    const supabase = await createServerClient()

    // Get the current item
    const { data: item, error: itemError } = await supabase.from("items").select("*").eq("id", itemId).single()

    if (itemError || !item) throw new Error("Item not found")

    // Find opposite type items in same category
    const oppositeType = item.type === "lost" ? "found" : "lost"
    const { data: candidates, error: candidatesError } = await supabase
      .from("items")
      .select("*")
      .eq("type", oppositeType)
      .eq("category", item.category)
      .eq("status", "active")
      .neq("user_id", item.user_id)

    if (candidatesError || !candidates || candidates.length === 0) {
      return { matches: [] }
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("[AI] Groq API key not configured")
      return { matches: [] }
    }

    // Use Groq AI to score matches
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that compares lost/found items and returns valid JSON."
        },
        {
          role: "user",
          content: `Compare this ${item.type} item with the following ${oppositeType} items and score each match from 0-100 based on similarity. Return a JSON array of objects with 'id' and 'score' fields, sorted by score descending.

${item.type.toUpperCase()} ITEM:
Title: ${item.title}
Description: ${item.description}
Category: ${item.category}
Location: ${item.location}

CANDIDATES:
${candidates.map((c, i) => `${i + 1}. ID: ${c.id}\nTitle: ${c.title}\nDescription: ${c.description}\nLocation: ${c.location}`).join("\n\n")}

Return only valid JSON array like: [{"id": "...", "score": 85}, ...]`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const text = completion.choices[0]?.message?.content || "[]"
    const matches = JSON.parse(text)
    const topMatches = matches.filter((m: { score: number }) => m.score > 60).slice(0, 5)

    // Store potential matches in database
    for (const match of topMatches) {
      await supabase.from("potential_matches").upsert({
        item_id: itemId,
        matched_item_id: match.id,
        confidence_score: match.score / 100,
      })
    }

    return { matches: topMatches }
  } catch (error) {
    console.error("Matching error:", error)
    return { matches: [] }
  }
}

export async function getPotentialMatches(itemId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("potential_matches")
    .select("*, matched_item:items!potential_matches_matched_item_id_fkey(*)")
    .eq("item_id", itemId)
    .order("confidence_score", { ascending: false })

  if (error) {
    console.error("Error fetching matches:", error)
    return []
  }

  return data || []
}
