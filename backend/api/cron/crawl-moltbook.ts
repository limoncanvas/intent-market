/**
 * Vercel Serverless Function for Moltbook Crawling
 * Can be triggered via Vercel Cron Jobs
 *
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/crawl-moltbook",
 *     "schedule": "0 */6 * * *"
 *   }]
 * }
 */

import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1'

interface MoltbookPost {
  id: string
  title?: string
  body?: string
  link_url?: string
  author: {
    molty_name: string
  }
  upvotes: number
  comment_count: number
  created_at: string
}

/**
 * Fetch posts from Moltbook
 */
async function fetchPosts(sort: string = 'new', limit: number = 20) {
  const response = await fetch(`${MOLTBOOK_API}/posts?sort=${sort}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${process.env.MOLTBOOK_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) return []
  const data = await response.json()
  return data.posts || []
}

/**
 * Analyze post and extract intent
 */
function extractIntent(post: MoltbookPost) {
  const content = post.body || post.title || ''

  // Intent patterns
  const isRequest = /(?:looking for|need|seeking|want|require)/i.test(content)
  const isOffering = /(?:offering|providing|can help|available)/i.test(content)
  const isCollab = /(?:collaborate|partner|team up)/i.test(content)

  if (!isRequest && !isOffering && !isCollab) return null

  // Category detection
  let category = 'other'
  if (/(?:API|SDK|code|develop|build)/i.test(content)) category = 'technical'
  else if (/(?:service|design|consulting|hire)/i.test(content)) category = 'service'
  else if (isCollab) category = 'collaboration'

  // Clean title
  let title = content.split(/[.!?]/)[0].trim()
  if (title.length > 100) title = title.substring(0, 97) + '...'

  // Clean description
  let description = content.trim()
  if (description.length > 500) description = description.substring(0, 497) + '...'

  return {
    title,
    description,
    category,
    posterName: post.author.molty_name,
    posterWallet: `moltbook:${post.author.molty_name}`,
    sourceUrl: post.link_url || `https://www.moltbook.com/posts/${post.id}`,
    sourcePlatform: 'moltbook'
  }
}

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify cron secret (optional security)
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    console.log('🚀 Starting Moltbook crawler...')

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // Fetch posts
    const sorts = ['hot', 'new', 'top']
    const allPosts: MoltbookPost[] = []

    for (const sort of sorts) {
      const posts = await fetchPosts(sort, 15)
      allPosts.push(...posts)
    }

    // Deduplicate
    const uniquePosts = Array.from(
      new Map(allPosts.map(p => [p.id, p])).values()
    )

    console.log(`📊 Found ${uniquePosts.length} unique posts`)

    // Process posts
    const results = {
      processed: 0,
      stored: 0,
      skipped: 0,
      errors: 0
    }

    for (const post of uniquePosts) {
      results.processed++

      try {
        // Check if exists
        const sourceUrl = post.link_url || `https://www.moltbook.com/posts/${post.id}`
        const { data: existing } = await supabase
          .from('intents')
          .select('id')
          .eq('source_url', sourceUrl)
          .single()

        if (existing) {
          results.skipped++
          continue
        }

        // Extract intent
        const intent = extractIntent(post)
        if (!intent) continue

        // Store intent
        const { error } = await supabase
          .from('intents')
          .insert({
            poster_wallet: intent.posterWallet,
            poster_name: intent.posterName,
            title: intent.title,
            description: intent.description,
            category: intent.category,
            is_private: false,
            source_platform: intent.sourcePlatform,
            source_url: intent.sourceUrl,
            created_at: new Date().toISOString()
          })

        if (error) {
          console.error('Store error:', error.message)
          results.errors++
        } else {
          results.stored++
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error('Processing error:', error)
        results.errors++
      }
    }

    console.log('✅ Crawl completed:', results)

    return res.status(200).json({
      success: true,
      ...results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Fatal error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
