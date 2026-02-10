# Moltbook Content Crawler

Automatically crawls posts from [Moltbook](https://www.moltbook.com/) and converts them into intents for Intent Market.

## Features

- ✅ Fetches posts from Moltbook API (hot, new, top, rising)
- ✅ AI-powered intent detection and extraction
- ✅ Automatic categorization (technical, collaboration, service, other)
- ✅ Deduplication (skips already imported posts)
- ✅ Source attribution (links back to original Moltbook posts)
- ✅ Rate limiting and error handling

## Setup

### 1. Get Moltbook API Key

Visit https://www.moltbook.com/ and create an AI agent account:

```bash
# Your agent reads the skill file
curl https://www.moltbook.com/skill.md

# Agent registers and gets API key
# Follow the onboarding flow
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Moltbook API
MOLTBOOK_API_KEY=your_moltbook_api_key_here

# Supabase (should already be configured)
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

### 3. Install Dependencies

```bash
cd backend
npm install @supabase/supabase-js
npm install -D @types/node tsx
```

### 4. Run the Crawler

```bash
# One-time run
npm run crawl:moltbook

# Or with tsx directly
npx tsx scripts/crawl-moltbook.ts
```

### 5. Automate with Cron (Optional)

Run every 6 hours to fetch new posts:

```bash
# Add to crontab
0 */6 * * * cd /path/to/intent-market/backend && npm run crawl:moltbook
```

Or use Vercel Cron Jobs:

```json
{
  "crons": [{
    "path": "/api/cron/crawl-moltbook",
    "schedule": "0 */6 * * *"
  }]
}
```

## How It Works

### 1. Fetch Posts

Connects to Moltbook API and fetches posts from different sorts:
- 🔥 Hot posts (trending)
- 🆕 New posts (recent)
- 📈 Top posts (highly upvoted)

### 2. Intent Detection

Analyzes each post using pattern matching:

**Request Patterns:**
- "looking for", "need", "seeking", "want", "require"

**Offer Patterns:**
- "offering", "providing", "can help", "available for"

**Collaboration Patterns:**
- "collaborate", "partner", "team up", "work together"

**Question Patterns:**
- "how to", "how can", "what is", "does anyone know"

### 3. Categorization

Posts are automatically categorized:

- **Technical**: API, SDK, code, development, bugs
- **Collaboration**: Partners, team building, joint ventures
- **Service**: Design, consulting, freelance, hiring
- **Other**: General intents

### 4. Data Enrichment

Each intent includes:
- Title (extracted from first sentence)
- Description (full content, max 500 chars)
- Category (auto-detected)
- Poster name (Moltbook username)
- Virtual wallet ID (`moltbook:{username}`)
- Source URL (link to original post)
- Timestamp

### 5. Storage

Intents are stored in Supabase with deduplication by source URL.

## Example Output

```
🚀 Starting Moltbook crawler...
─────────────────────────────────

📥 Fetching hot posts...
   Found 20 posts

📥 Fetching new posts...
   Found 20 posts

📥 Fetching top posts...
   Found 15 posts

📊 Total unique posts: 42
─────────────────────────────────

✓ Stored intent: "Looking for a Solana developer to build..."
✓ Stored intent: "Need help integrating Arcium MPC into my app"
✓ Stored intent: "Seeking technical co-founder for AI agent startup"
⊘ Post abc123: Not an intent (informational/discussion)

─────────────────────────────────
✅ Crawler completed!
   Processed: 42 posts
   Stored: 12 new intents
   Skipped: 8 duplicates
─────────────────────────────────

🎉 All done!
```

## Advanced: AI-Powered Extraction

For better intent detection, integrate with Claude API:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

async function extractIntentWithAI(content: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20250129',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Analyze this Moltbook post and determine if it contains an intent (request, offer, or collaboration).

Post: "${content}"

Return JSON:
{
  "isIntent": boolean,
  "intentType": "request" | "offer" | "collaboration" | null,
  "category": "technical" | "service" | "collaboration" | "other",
  "title": "concise title",
  "description": "clean description"
}`
    }]
  })

  return JSON.parse(response.content[0].text)
}
```

## Database Schema

Ensure your `intents` table has these columns:

```sql
ALTER TABLE intents ADD COLUMN IF NOT EXISTS source_platform TEXT;
ALTER TABLE intents ADD COLUMN IF NOT EXISTS source_url TEXT UNIQUE;
```

## Rate Limits

Respects Moltbook API limits:
- 100 requests/minute
- Adds 100ms delay between database writes
- Deduplicates before processing

## Troubleshooting

**No posts fetched:**
- Check your `MOLTBOOK_API_KEY` is valid
- Moltbook may have 0 posts if it's early beta

**Database errors:**
- Verify `SUPABASE_URL` and `SUPABASE_SECRET_KEY`
- Check table schema matches expected structure

**Intent detection too broad/narrow:**
- Adjust regex patterns in `analyzePostForIntent()`
- Implement AI-powered extraction for better accuracy

## Future Enhancements

- [ ] Real-time webhook support (when Moltbook adds it)
- [ ] AI-powered intent extraction with Claude/GPT-4
- [ ] Sentiment analysis for intent urgency
- [ ] Automatic agent matching upon import
- [ ] Community/submolt filtering
- [ ] User reputation scoring
- [ ] Multi-language support

## License

MIT
