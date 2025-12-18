# Verify Claim AI Edge Function

This Supabase Edge Function performs asynchronous AI verification of claim answers using Groq's LLM.

## Purpose

When a user submits a claim for a lost/found item, this function:
1. Fetches the item details and verification questions
2. Uses Groq AI to analyze the claimant's answers
3. Updates the claim record with AI analysis results

## Deployment

Deploy this function to Supabase:

```bash
supabase functions deploy verify-claim-ai --no-verify-jwt
```

## Environment Variables

Required environment variables in Supabase:
- `GROQ_API_KEY` - Your Groq API key for AI analysis
- `SUPABASE_URL` - Automatically provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided by Supabase

## Usage

This function is called automatically (fire-and-forget) when a claim is submitted. It runs asynchronously and updates the claim record when complete.

The frontend does not wait for this function to complete, allowing for a faster user experience.

## Input

```json
{
  "claim_id": "uuid",
  "item_id": "uuid",
  "questions": [
    {
      "id": "uuid",
      "question_text": "string"
    }
  ],
  "answers": {
    "question_id": "answer_text"
  }
}
```

## Output

Updates the `claims` table with:
- `ai_verdict`: Confidence percentage (0-100)
- `ai_analysis`: Brief summary of the analysis
- `ai_question_analysis`: Detailed analysis per question
