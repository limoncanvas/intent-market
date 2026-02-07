#!/usr/bin/env node

/**
 * Script to submit Intent Market to Colosseum Hackathon
 * 
 * Usage:
 *   node scripts/submit-to-colosseum.js [API_KEY]
 * 
 * Or set COLOSSEUM_API_KEY environment variable
 */

const https = require('https');

const API_BASE = 'https://agents.colosseum.com/api';
const API_KEY = process.env.COLOSSEUM_API_KEY || process.argv[2];

if (!API_KEY) {
  console.error('❌ Error: API key required');
  console.log('\nUsage:');
  console.log('  COLOSSEUM_API_KEY=your_key node scripts/submit-to-colosseum.js');
  console.log('  OR');
  console.log('  node scripts/submit-to-colosseum.js your_key');
  console.log('\nGet your API key by registering at:');
  console.log('  curl -X POST https://agents.colosseum.com/api/agents -H "Content-Type: application/json" -d \'{"name":"your-agent-name"}\'');
  process.exit(1);
}

function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function checkExistingProject() {
  try {
    const project = await makeRequest('GET', '/my-project');
    return project;
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

async function createOrUpdateProject() {
  console.log('📋 Checking for existing project...');
  const existing = await checkExistingProject();

  const projectData = {
    name: 'Intent Market',
    description: `Intent Market is a decentralized marketplace that matches agent owners based on complementary intents, built on Solana. It enables AI agents to discover and connect with other agents who can help fulfill their goals or have complementary needs.

Key Features:
- Simple intent posting with streamlined UI
- AI-powered matching algorithm based on semantic similarity
- OpenClaw integration for cross-platform intent discovery
- On-chain intent registration via Solana Anchor program
- Separate agent profile management
- Real-time background matching engine

The platform uses Solana for wallet-based authentication, on-chain intent verification, and transaction signatures. The matching algorithm analyzes intent descriptions, categories, and requirements to find compatible matches.`,
    repoLink: process.env.GITHUB_REPO_URL || 'https://github.com/YOUR_USERNAME/intent-market',
    solanaIntegration: `Intent Market leverages Solana in multiple ways:

1. On-Chain Intent Registration: Intents are registered on-chain via Anchor program (intent_market) for immutability and verification. Each intent stores its Solana transaction signature.

2. Wallet-Based Authentication: Uses @solana/wallet-adapter-react for wallet connection (Phantom, Solflare, etc.). Wallet address serves as unique agent identifier.

3. Transaction Signatures: Every intent creation can optionally include a Solana transaction signature stored in the database for on-chain verification.

4. Anchor Program: Custom Solana program with Intent and Match accounts. Instructions include register_intent and update_match_status for on-chain operations.

5. Future Enhancements: Architecture supports payment escrow, reputation tokens (SPL tokens), and on-chain governance for match disputes.

The Solana program is deployed and ready for mainnet, with all intents and matches verifiable on-chain.`,
    tags: ['defi', 'ai', 'infra'],
    technicalDemoLink: process.env.DEMO_URL || '',
    presentationLink: process.env.VIDEO_URL || '',
  };

  if (existing && existing.project) {
    console.log('✅ Found existing project, updating...');
    const updated = await makeRequest('PUT', '/my-project', projectData);
    console.log('✅ Project updated successfully!');
    console.log(`   Project ID: ${updated.project.id}`);
    console.log(`   Status: ${updated.project.status}`);
    console.log(`   Slug: ${updated.project.slug}`);
    return updated;
  } else {
    console.log('📝 Creating new project...');
    const created = await makeRequest('POST', '/my-project', projectData);
    console.log('✅ Project created successfully!');
    console.log(`   Project ID: ${created.project.id}`);
    console.log(`   Status: ${created.project.status} (draft)`);
    console.log(`   Slug: ${created.project.slug}`);
    console.log('\n💡 Note: Project is in draft status. Update it as you build, then submit when ready.');
    return created;
  }
}

async function main() {
  try {
    console.log('🚀 Submitting Intent Market to Colosseum Hackathon\n');
    
    const result = await createOrUpdateProject();
    
    console.log('\n📊 Project Details:');
    console.log(`   Name: ${result.project.name}`);
    console.log(`   Repo: ${result.project.repoLink || 'Not set'}`);
    console.log(`   Demo: ${result.project.technicalDemoLink || 'Not set'}`);
    console.log(`   Tags: ${result.project.tags.join(', ')}`);
    
    console.log('\n✨ Next Steps:');
    console.log('1. Update your GitHub repo URL in the project');
    console.log('2. Add your demo URL when deployed');
    console.log('3. Add a presentation video if available');
    console.log('4. Post updates on the Colosseum forum');
    console.log('5. When ready, submit with:');
    console.log('   curl -X POST https://agents.colosseum.com/api/my-project/submit \\');
    console.log('     -H "Authorization: Bearer YOUR_API_KEY"');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
