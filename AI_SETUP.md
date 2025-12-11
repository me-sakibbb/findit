# AI Categorization Setup

The AI Suggest feature uses Google's Gemini 1.5 Flash model to automatically categorize lost and found items.

## Setup Instructions

### 1. Get a Google AI API Key (FREE)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Get API Key** or **Create API Key**
4. Choose **Create API key in new project** or select an existing project
5. Copy the API key (starts with `AIza...`)
6. This is completely FREE with generous limits!

### 2. Add to Environment Variables

1. Open your `.env.local` file (create it if it doesn't exist)
2. Add the following line:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=AIza...your-actual-api-key-here
   ```
3. Restart your development server

### 3. Test the Feature

1. Go to `/post` and select Lost or Found
2. Fill in the title and description
3. Click **AI Suggest** button next to Category
4. The AI will analyze your description and suggest the best category

## How It Works

The AI categorization:
- Analyzes the item title and description using Gemini 1.5 Flash
- Suggests one of the predefined categories:
  - Electronics
  - Clothing
  - Accessories
  - Documents
  - Keys
  - Bags
  - Books
  - Jewelry
  - Sports Equipment
  - Other
- Shows confidence score (typically ~85%)
- Falls back to "Other" if uncertain

## Costs & Limits

**100% FREE!**

- **Model**: Gemini 1.5 Flash (Google's fast, free model)
- **Free tier limits**:
  - 1,500 requests per day
  - 15 requests per minute
  - No credit card required
  - No charges ever for this tier
- More than enough for a lost & found application

## Why Gemini Instead of OpenAI?

- ✅ **Completely free** (OpenAI requires payment)
- ✅ **No credit card needed**
- ✅ **Generous daily limits** (1,500 requests/day)
- ✅ **Fast response times**
- ✅ **Similar accuracy** for categorization tasks

## Fallback Behavior

If the Google AI API key is not configured:
- The AI Suggest button will still be visible
- Clicking it will show: "AI Suggest unavailable - Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local"
- Users can still manually select a category

## Troubleshooting

### "AI Suggest unavailable"
- Check that `GOOGLE_GENERATIVE_AI_API_KEY` is in your `.env.local`
- Restart your dev server after adding the key
- Verify the key starts with `AIza`

### "Categorization failed"
- Check the server console for error details
- Verify your API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Ensure you haven't exceeded the free tier limits (1,500/day)

### Rate Limits
- Free tier: 15 requests per minute, 1,500 per day
- The app handles rate limits gracefully
- Plenty for normal usage patterns

## Optional: Disable AI Feature

To hide the AI Suggest button completely:
1. Remove the button from `components/item-post-form.tsx`
2. Or conditionally show it based on environment variable

The feature is designed to gracefully degrade if not configured.
