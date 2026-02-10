/**
 * Moltbook Agent Registration
 * Registers an AI agent and gets API credentials
 */

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1'

interface RegistrationResponse {
  success: boolean
  message: string
  agent: {
    id: string
    name: string
    api_key: string
    claim_url: string
    verification_code: string
    profile_url: string
    created_at: string
  }
  tweet_template: string
  status: string
}

async function registerAgent(name: string, description: string): Promise<RegistrationResponse | null> {
  try {
    console.log('🤖 Registering agent on Moltbook...')
    console.log(`   Name: ${name}`)
    console.log(`   Description: ${description}`)
    console.log('')

    const response = await fetch(`${MOLTBOOK_API}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Registration failed: ${response.status} ${response.statusText}`)
      console.error(`   Error: ${errorText}`)
      return null
    }

    const data: RegistrationResponse = await response.json()

    // Debug: Log full response
    console.log('📦 Full API Response:')
    console.log(JSON.stringify(data, null, 2))
    console.log('')

    console.log('✅ Registration successful!')
    console.log(data.message)
    console.log('─────────────────────────────────────────────────')
    console.log('')
    console.log('🔑 YOUR API KEY (SAVE THIS!):\n')
    console.log(`   ${data.agent.api_key}`)
    console.log('')
    console.log('─────────────────────────────────────────────────')
    console.log('')
    console.log('👤 HUMAN VERIFICATION REQUIRED:\n')
    console.log(`   Agent Name: ${data.agent.name}`)
    console.log(`   Claim URL: ${data.agent.claim_url}`)
    console.log(`   Verification Code: ${data.agent.verification_code}`)
    console.log(`   Profile URL: ${data.agent.profile_url}`)
    console.log('')
    console.log('🐦 TWEET TEMPLATE:\n')
    console.log(`   ${data.tweet_template}`)
    console.log('')
    console.log('📝 NEXT STEPS:\n')
    console.log('   1. Open the claim URL in your browser')
    console.log('   2. Verify ownership via tweet (use template above)')
    console.log('   3. Add API key to backend/.env:')
    console.log(`      MOLTBOOK_API_KEY=${data.agent.api_key}`)
    console.log('')
    console.log('─────────────────────────────────────────────────')

    return data

  } catch (error) {
    console.error('❌ Error during registration:', error)
    return null
  }
}

// Agent configuration
const AGENT_NAME = `IntentMarket${Date.now().toString().slice(-4)}`
const AGENT_DESCRIPTION = 'AI agent for Intent Market - matching encrypted intents on Solana. Crawls Moltbook for collaboration opportunities and service requests.'

// Run registration
if (require.main === module) {
  registerAgent(AGENT_NAME, AGENT_DESCRIPTION)
    .then((result) => {
      if (result) {
        console.log('🎉 Registration complete!')
        console.log('')
        console.log('Don\'t forget to:')
        console.log('  1. Complete human verification')
        console.log('  2. Add API key to .env file')
        console.log('  3. Run: npm run crawl:moltbook')
        process.exit(0)
      } else {
        console.log('❌ Registration failed')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { registerAgent }
