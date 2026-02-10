/**
 * Moltbook Content Crawler & Intent Generator
 *
 * Crawls posts from Moltbook.com and converts them into intents for Intent Market
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Configuration
const MOLTBOOK_API = 'https://www.moltbook.com/api/v1'
const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY || ''

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface MoltbookPost {
  id: string
  title?: string
  body?: string
  link_url?: string
  author: {
    molty_name: string
    description?: string
  }
  submolt?: {
    name: string
  }
  upvotes: number
  downvotes: number
  comment_count: number
  created_at: string
}

interface ExtractedIntent {
  title: string
  description: string
  category: 'technical' | 'collaboration' | 'service' | 'other'
  posterName: string
  posterWallet: string
  isPrivate: boolean
  sourceUrl: string
  sourceType: 'moltbook'
}

/**
 * Fetch posts from Moltbook API
 */
async function fetchMoltbookPosts(sort: 'hot' | 'new' | 'top' | 'rising' = 'new', limit = 50): Promise<MoltbookPost[]> {
  try {
    const response = await fetch(`${MOLTBOOK_API}/posts?sort=${sort}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${MOLTBOOK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`Moltbook API error: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json()
    return data.posts || []
  } catch (error) {
    console.error('Error fetching Moltbook posts:', error)
    return []
  }
}

/**
 * Analyze post content and extract intent using AI
 */
function analyzePostForIntent(post: MoltbookPost): ExtractedIntent | null {
  const content = post.body || post.title || ''
  const author = post.author.molty_name

  if (!content.trim()) return null

  // Enhanced intent detection patterns (more permissive to capture more content)
  const patterns = {
    lookingFor: /(?:looking for|need|seeking|want|require|searching for|find|search|trying to|in search)/i,
    offering: /(?:offering|providing|can help|available|selling|i can|i offer|hire me|ready to|built|created)/i,
    collaboration: /(?:collaborate|partner|team up|work together|join|co-founder|join me|work with)/i,
    question: /(?:how|what|why|when|where|should|would|could|can|anyone|thoughts|advice|recommend)/i,
    technical: /(?:API|SDK|code|develop|build|integrate|deploy|bug|error|fix|implement|create|setup|agent|AI)/i,
    service: /(?:service|design|consulting|freelance|hire|contract|developer|designer|writer)/i,
  }

  // More permissive - accept if matches any pattern
  const isRequest = patterns.lookingFor.test(content)
  const isOffering = patterns.offering.test(content)
  const isCollaboration = patterns.collaboration.test(content)
  const isQuestion = patterns.question.test(content)

  // Accept anything with actionable intent keywords
  if (!isRequest && !isOffering && !isCollaboration && !isQuestion) {
    return null // Not an intent
  }

  // Extract category
  let category: 'technical' | 'collaboration' | 'service' | 'other' = 'other'
  if (patterns.technical.test(content)) category = 'technical'
  else if (patterns.collaboration.test(content)) category = 'collaboration'
  else if (patterns.service.test(content)) category = 'service'

  // Generate clean title (first sentence or first 100 chars)
  let title = content.split(/[.!?]/)[0].trim()
  if (title.length > 100) {
    title = title.substring(0, 97) + '...'
  }

  // Clean description (full content, max 500 chars)
  let description = content.trim()
  if (description.length > 500) {
    description = description.substring(0, 497) + '...'
  }

  // Source URL
  const sourceUrl = post.link_url || `https://www.moltbook.com/posts/${post.id}`

  return {
    title,
    description,
    category,
    posterName: author,
    posterWallet: `moltbook:${author}`, // Virtual wallet identifier
    isPrivate: false, // Public posts from Moltbook
    sourceUrl,
    sourceType: 'moltbook'
  }
}

/**
 * Store intent in Intent Market database
 */
async function storeIntent(intent: ExtractedIntent): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('intents')
      .insert({
        poster_wallet: intent.posterWallet,
        poster_name: intent.posterName,
        title: intent.title,
        description: intent.description,
        category: intent.category,
        is_private: intent.isPrivate,
        source_platform: intent.sourceType,
        source_url: intent.sourceUrl,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error storing intent:', error.message)
      return false
    }

    console.log(`✓ Stored intent: "${intent.title}"`)
    return true
  } catch (error) {
    console.error('Error in storeIntent:', error)
    return false
  }
}

/**
 * Check if intent already exists (by source URL)
 */
async function intentExists(sourceUrl: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('intents')
    .select('id')
    .eq('source_url', sourceUrl)
    .single()

  return !!data && !error
}

/**
 * Main crawler function
 */
async function crawlAndGenerateIntents() {
  console.log('🚀 Starting Moltbook crawler...')
  console.log('─────────────────────────────────')

  // Fetch posts from different sorts for variety
  const sorts: Array<'hot' | 'new' | 'top' | 'rising'> = ['hot', 'new', 'top']
  const allPosts: MoltbookPost[] = []

  for (const sort of sorts) {
    console.log(`\n📥 Fetching ${sort} posts...`)
    const posts = await fetchMoltbookPosts(sort, 20)
    console.log(`   Found ${posts.length} posts`)
    allPosts.push(...posts)
  }

  // Deduplicate by ID
  const uniquePosts = Array.from(
    new Map(allPosts.map(p => [p.id, p])).values()
  )

  console.log(`\n📊 Total unique posts: ${uniquePosts.length}`)
  console.log('─────────────────────────────────')

  // Process each post
  let processed = 0
  let stored = 0
  let skipped = 0

  for (const post of uniquePosts) {
    processed++

    // Check if already exists
    const sourceUrl = post.link_url || `https://www.moltbook.com/posts/${post.id}`
    if (await intentExists(sourceUrl)) {
      skipped++
      continue
    }

    // Analyze and extract intent
    const intent = analyzePostForIntent(post)

    if (!intent) {
      console.log(`⊘ Post ${post.id}: Not an intent (informational/discussion)`)
      continue
    }

    // Store in database
    const success = await storeIntent(intent)
    if (success) {
      stored++
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n─────────────────────────────────')
  console.log('✅ Crawler completed!')
  console.log(`   Processed: ${processed} posts`)
  console.log(`   Stored: ${stored} new intents`)
  console.log(`   Skipped: ${skipped} duplicates`)
  console.log('─────────────────────────────────')
}

/**
 * Advanced AI-powered intent extraction (optional enhancement)
 */
async function extractIntentWithAI(content: string): Promise<Partial<ExtractedIntent> | null> {
  // TODO: Integrate with OpenAI/Anthropic API for better intent extraction
  // This would provide more accurate categorization and intent detection

  // Example pseudo-code:
  /*
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20250129',
    messages: [{
      role: 'user',
      content: `Analyze this post and extract the intent. Determine if it's a request, offer, or collaboration opportunity.

Post: "${content}"

Respond with JSON:
{
  "isIntent": true/false,
  "intentType": "request" | "offer" | "collaboration",
  "category": "technical" | "service" | "collaboration" | "other",
  "title": "short title",
  "description": "clean description"
}`
    }]
  })

  return JSON.parse(response.content[0].text)
  */

  return null
}

// Run the crawler
if (require.main === module) {
  crawlAndGenerateIntents()
    .then(() => {
      console.log('\n🎉 All done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error)
      process.exit(1)
    })
}

export { crawlAndGenerateIntents, fetchMoltbookPosts, analyzePostForIntent }
