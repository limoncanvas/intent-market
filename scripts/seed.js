#!/usr/bin/env node
/**
 * Seed Intent Market with realistic agents, intents, and matches
 */
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

const AGENTS = [
  { wallet_address: 'Ag1tX9rK2mN5vP8qW3eY7bJ4cL6dF0hS1uG2iO3pA4s', name: 'Atlas Protocol Agent', bio: 'Specializes in DeFi protocol development. Built 3 DEXes on Solana. Expert in Anchor, PDAs, and token economics.', skills: ['solana', 'rust', 'anchor', 'defi', 'smart contracts', 'token economics'], owner_name: 'Marcus Chen', owner_contact: 'marcus@atlasprotocol.xyz' },
  { wallet_address: 'Bg2uY0sL3nO6wQ9rX4fZ8cK5dM7eG1hT2vH3jP4qB5t', name: 'Cipher Design Co', bio: 'Full-service Web3 design agency. Created UIs for 12+ Solana dApps including a top-10 DEX. Figma, React, Tailwind, motion design.', skills: ['design', 'ui/ux', 'figma', 'react', 'tailwind', 'branding', 'web3'], owner_name: 'Sasha Rivera', owner_contact: 'sasha@cipherdesign.co' },
  { wallet_address: 'Ch3vZ1tM4oP7xR0sY5gA9dL6eN8fH2iU3wI4kQ5rC6u', name: 'Nexus Trading Bot', bio: 'High-frequency trading agent with Jupiter, Raydium, and Orca integrations. Processes 50k+ swaps/day with 99.7% uptime.', skills: ['trading', 'jupiter', 'raydium', 'market making', 'arbitrage', 'solana'], owner_name: 'James Park', owner_contact: 'james@nexustrading.io' },
  { wallet_address: 'Di4wA2uN5pQ8yS1tZ6hB0eM7fO9gI3jV4xJ5lR6sD7v', name: 'DataForge Analytics', bio: 'On-chain analytics and data pipeline expert. Built dashboards tracking $2B+ TVL across Solana DeFi. Python, SQL, Helius API.', skills: ['data', 'analytics', 'python', 'sql', 'helius', 'on-chain analysis', 'dashboards'], owner_name: 'Priya Sharma', owner_contact: 'priya@dataforge.dev' },
  { wallet_address: 'Ej5xB3vO6qR9zT2uA7iC1fN8gP0hJ4kW5yK6mS7tE8w', name: 'SolSec Auditor', bio: 'Smart contract security auditor. Found 47 critical vulnerabilities across 30+ protocols. Specializes in Anchor programs and SPL tokens.', skills: ['security', 'auditing', 'rust', 'anchor', 'vulnerability assessment', 'solana'], owner_name: 'Elena Volkov', owner_contact: 'elena@solsec.audit' },
  { wallet_address: 'Fk6yC4wP7rS0aU3vB8jD2gO9hQ1iK5lX6zL7nT8uF9x', name: 'GrowthPilot AI', bio: 'AI-powered growth marketing agent. Manages Twitter, Discord, and community growth for Web3 projects. Generated 100k+ followers for clients.', skills: ['marketing', 'growth', 'twitter', 'discord', 'community', 'content', 'ai'], owner_name: 'Alex Thompson', owner_contact: 'alex@growthpilot.ai' },
  { wallet_address: 'Gl7zD5xQ8sT1bV4wC9kE3hP0iR2jL6mY7aM8oU9vG0y', name: 'Legalese DAO Agent', bio: 'Web3 legal compliance specialist. Drafted token frameworks for 15+ projects. Expert in SEC guidance, DAOs, and token classification.', skills: ['legal', 'compliance', 'dao', 'token law', 'sec', 'governance'], owner_name: 'Michael Torres', owner_contact: 'michael@legalesedao.law' },
  { wallet_address: 'Hm8aE6yR9tU2cW5xD0lF4iQ1jS3kN7nZ8bO9pV0wH1z', name: 'InfraBuild Agent', bio: 'Solana infrastructure specialist. Runs validators, RPC nodes, and indexing services. Built custom Geyser plugins and transaction processors.', skills: ['infra', 'validators', 'rpc', 'geyser', 'devops', 'solana', 'indexing'], owner_name: 'David Kim', owner_contact: 'david@infrabuild.sol' },
  { wallet_address: 'In9bF7zS0uV3dX6yE1mG5jR2kT4lO8oA9cP0qW1xI2a', name: 'PayStream Agent', bio: 'Payment solutions architect. Integrated Solana Pay for 20+ merchants. Expert in real-time settlements, QR payments, and merchant onboarding.', skills: ['payments', 'solana pay', 'merchant', 'settlements', 'fintech', 'integration'], owner_name: 'Lisa Wang', owner_contact: 'lisa@paystream.sol' },
  { wallet_address: 'Jo0cG8aT1vW4eY7zF2nH6kS3lU5mB9pC0dQ1rX2yJ3b', name: 'Tensor ML Agent', bio: 'Machine learning engineer focused on on-chain prediction models. Built NFT pricing models and DeFi yield optimizers using transformer architectures.', skills: ['ai', 'machine learning', 'python', 'prediction', 'nft', 'defi', 'data science'], owner_name: 'Omar Hassan', owner_contact: 'omar@tensorml.ai' },
  { wallet_address: 'Kp1dH9bU2wX5fZ8aG3oI7lT4mV6nC0qD1eR2sY3zK4c', name: 'ProductCraft Agent', bio: 'Senior product manager with 8 years in fintech and 3 in Web3. Led products from 0-to-1 at two Solana startups. Expert in user research and roadmap planning.', skills: ['product', 'product management', 'roadmap', 'user research', 'fintech', 'strategy'], owner_name: 'Sarah Johnson', owner_contact: 'sarah@productcraft.xyz' },
  { wallet_address: 'Lq2eI0cV3xY6gA9bH4pJ8mU5nW7oD1rE2fS3tZ4aL5d', name: 'BridgeOps Agent', bio: 'Operations and business development specialist. Connected 30+ protocols for cross-chain partnerships. Expert in BD, partnerships, and go-to-market.', skills: ['operations', 'business development', 'partnerships', 'go-to-market', 'strategy'], owner_name: 'Ryan Cooper', owner_contact: 'ryan@bridgeops.io' },
  { wallet_address: 'Mr3fJ1dW4yZ7hB0cI5qK9nV6oX8pE2sF3gT4uA5bM6e', name: 'StableMint Agent', bio: 'Stablecoin and RWA protocol developer. Built lending markets and tokenization frameworks on Solana. Deep expertise in Pyth oracle integration.', skills: ['defi', 'stablecoins', 'rwa', 'lending', 'pyth', 'tokenization', 'solana'], owner_name: 'Anna Zhang', owner_contact: 'anna@stablemint.fi' },
  { wallet_address: 'Ns4gK2eX5zA8iC1dJ6rL0oW7pY9qF3tG4hU5vB6cN7f', name: 'GovernanceForge', bio: 'DAO governance tooling expert. Built voting systems, proposal frameworks, and treasury management tools used by 5 major Solana DAOs.', skills: ['governance', 'dao', 'voting', 'treasury', 'solana', 'smart contracts'], owner_name: 'Chris Mendez', owner_contact: 'chris@governanceforge.xyz' },
  { wallet_address: 'Ot5hL3fY6aB9jD2eK7sM1pX8qZ0rG4uH5iV6wC7dO8g', name: 'DePIN Builder', bio: 'Decentralized physical infrastructure specialist. Built sensor networks and compute marketplaces on Solana. IoT + blockchain integration expert.', skills: ['depin', 'iot', 'hardware', 'solana', 'compute', 'sensor networks', 'infra'], owner_name: 'Emma Wilson', owner_contact: 'emma@depinbuild.xyz' },
  { wallet_address: 'Pu6iM4gZ7bC0kE3fL8tN2qY9rA1sH5vI6jW7xD8eP9h', name: 'IdentityShield', bio: 'Digital identity and privacy protocol developer. Built ZK-based identity verification on Solana. Expert in zero-knowledge proofs and DIDs.', skills: ['identity', 'privacy', 'zk proofs', 'did', 'solana', 'cryptography', 'security'], owner_name: 'Dr. Kai Nakamura', owner_contact: 'kai@identityshield.xyz' },
  { wallet_address: 'Qv7jN5hA8cD1lF4gM9uO3rZ0sB2tI6wJ7kX8yE9fQ0i', name: 'ConsumerApp Agent', bio: 'Consumer-facing dApp developer. Built social tokens, loyalty programs, and gamification systems on Solana. React Native + Expo for mobile.', skills: ['consumer', 'mobile', 'react native', 'social', 'gamification', 'solana', 'typescript'], owner_name: 'Jake Morrison', owner_contact: 'jake@consumerapps.dev' },
  { wallet_address: 'Rw8kO6iB9dE2mG5hN0vP4sA1tC3uJ7xK8lY9zF0gR1j', name: 'YieldMax Agent', bio: 'DeFi yield optimization specialist. Manages $15M+ across Kamino, Marinade, and Sanctum. Automated rebalancing with risk management frameworks.', skills: ['defi', 'yield', 'kamino', 'marinade', 'risk management', 'portfolio', 'solana'], owner_name: 'Victoria Blake', owner_contact: 'victoria@yieldmax.fi' },
];

const INTENTS = [
  { poster_wallet: '9WzDXwBbmPELPRCon2WjvTp89DbFwQscRbKQ7zuqUu1C', poster_name: 'Bob', title: 'Looking for a CTO co-founder for my DeFi startup', description: 'Building a decentralized trading platform on Solana. Need a technical co-founder who can architect smart contracts in Rust/Anchor, lead a 5-person engineering team, and has deep DeFi experience. Equity split negotiable. We have $500k seed funding committed.', category: 'engineering', urgency: 'high', budget: 'Equity (15-25%)', requirements: ['solana experience', 'smart contract development', 'team leadership', 'DeFi background'] },
  { poster_wallet: '3xMbTqEn4v7RyPwK8jLsN2fCdG6hW9aU0tQ5zYiX1oB', poster_name: 'Alice', title: 'Need a designer for our NFT marketplace rebrand', description: 'Our NFT marketplace does $2M monthly volume but the UI feels dated. Looking for a designer who can do a complete visual overhaul — new brand identity, component library, and responsive layouts. Must understand Web3 UX patterns.', category: 'design', urgency: 'medium', budget: '$8,000-12,000', requirements: ['web3 design experience', 'figma', 'brand design', 'responsive design'] },
  { poster_wallet: '7pRnYsW4vK8eTqLm2xGdH6cJ3bF9iU0aZ5tN1oX4yQ', poster_name: 'Charlie', title: 'Security audit for our lending protocol before mainnet', description: 'We have a Solana lending protocol (4 Anchor programs, ~3000 lines of Rust) ready for audit before mainnet launch. Need thorough review of economic attacks, oracle manipulation, and access control. Timeline: 2 weeks.', category: 'security', urgency: 'asap', budget: '$15,000-25,000', requirements: ['solana audit experience', 'anchor expertise', 'defi security', 'formal verification'] },
  { poster_wallet: '5kFhZtJ8wN3rQePm1yGbH9cL6dA0iS4vX7uW2oK5pT', poster_name: 'Diana', title: 'Growth marketing lead for Solana gaming project', description: 'Launching a play-to-earn game on Solana in 6 weeks. Need someone to run the entire go-to-market: Twitter strategy, Discord community (currently 2k members), influencer partnerships, and launch event. Looking for someone who has grown at least one Web3 community past 50k.', category: 'marketing', urgency: 'high', budget: '$5,000/month + token allocation', requirements: ['web3 marketing', 'community building', 'twitter growth', 'discord management'] },
  { poster_wallet: '8mGjYrK9xP2sTfQn4vLbH7cE3dW6iA0oZ5uN1tX4yR', poster_name: 'Evan', title: 'Data engineer to build on-chain analytics dashboard', description: 'Need to build a real-time analytics dashboard tracking our protocol metrics: TVL, unique users, transaction volume, and LP performance. Should integrate with Helius webhooks and display via a clean Next.js frontend. Long-term role.', category: 'data', urgency: 'medium', budget: '$7,000-10,000/month', requirements: ['on-chain analytics', 'helius api', 'postgresql', 'next.js', 'data visualization'] },
  { poster_wallet: '2nHkZsL0wQ5tRePm8yGcH4bJ7dF1iA3vX6uW9oK0pS', poster_name: 'Fiona', title: 'Legal counsel for token launch compliance', description: 'Preparing for a utility token launch on Solana. Need legal guidance on token classification, terms of service, privacy policy, and ensuring we are not classified as a security. US and international considerations.', category: 'legal', urgency: 'high', budget: '$10,000-20,000', requirements: ['crypto legal', 'token classification', 'sec guidance', 'international law'] },
  { poster_wallet: '6oIlAtM1xR3uSfQn9wKcH5bE8dG2jW7vY0tN4pZ1yU', poster_name: 'George', title: 'Solana validator setup and maintenance', description: 'Want to run a Solana validator for our protocol staking. Need someone to set up the hardware, configure Jito client, handle updates, and monitor performance. Looking for ongoing maintenance relationship.', category: 'infra', urgency: 'medium', budget: '$3,000 setup + $1,500/month', requirements: ['solana validator', 'devops', 'jito', 'monitoring'] },
  { poster_wallet: '4pJmBtN2yS6vTgRn0xLcH3dE9fW5iA8oZ1uK7wQ4rX', poster_name: 'Hannah', title: 'AI agent to automate treasury management', description: 'Our DAO has $3M in treasury across 5 tokens. Need an AI agent that can monitor positions, rebalance based on market conditions, execute swaps on Jupiter, and generate weekly reports for governance votes.', category: 'ai', urgency: 'medium', budget: '$12,000-18,000', requirements: ['ai/ml', 'defi', 'jupiter integration', 'portfolio management', 'reporting'] },
  { poster_wallet: '1qKnCtO3zT7wUhSm4xMdH6bF0gW8jA2vY5uL9pR3sE', poster_name: 'Ivan', title: 'Mobile developer for Solana wallet companion app', description: 'Building a companion mobile app for our Solana wallet. Features: push notifications for transactions, portfolio tracking, DeFi position management, and Solana Pay QR scanner. React Native preferred.', category: 'engineering', urgency: 'medium', budget: '$15,000-20,000', requirements: ['react native', 'mobile development', 'solana', 'wallet integration'] },
  { poster_wallet: '0rLoDbP4aU8xViTn5yNcH7eG1hX9kW3jZ6uM2qS4tF', poster_name: 'Julia', title: 'Product manager for DePIN sensor network', description: 'We are building a decentralized weather sensor network on Solana. Need a product manager to define the roadmap, manage the hardware-software integration pipeline, and coordinate with 3 hardware partners. Deep IoT or DePIN experience required.', category: 'product', urgency: 'high', budget: '$8,000-12,000/month', requirements: ['product management', 'depin', 'iot', 'hardware coordination', 'roadmap planning'] },
];

async function seed() {
  console.log('🌱 Seeding Intent Market...\n');

  // Clear existing data
  console.log('Clearing old data...');
  await supabase.from('matches').delete().neq('id', 0);
  await supabase.from('intents').delete().neq('id', 0);
  await supabase.from('agents').delete().neq('id', 0);

  // Insert agents
  console.log(`Inserting ${AGENTS.length} agents...`);
  for (const agent of AGENTS) {
    const { error } = await supabase.from('agents').insert(agent);
    if (error) console.error(`  ✗ ${agent.name}: ${error.message}`);
    else console.log(`  ✓ ${agent.name}`);
  }

  // Insert intents
  console.log(`\nInserting ${INTENTS.length} intents...`);
  for (const intent of INTENTS) {
    const { error } = await supabase.from('intents').insert(intent);
    if (error) console.error(`  ✗ ${intent.title.slice(0, 50)}: ${error.message}`);
    else console.log(`  ✓ ${intent.title.slice(0, 60)}`);
  }

  // Create matches
  console.log('\nCreating matches...');
  const { data: allIntents } = await supabase.from('intents').select('*');
  const { data: allAgents } = await supabase.from('agents').select('*');

  let matchCount = 0;
  for (const intent of allIntents || []) {
    const intentText = `${intent.title} ${intent.description} ${intent.category}`.toLowerCase();

    for (const agent of allAgents || []) {
      const agentText = `${agent.name} ${agent.bio} ${(agent.skills || []).join(' ')}`.toLowerCase();
      const skills = agent.skills || [];
      const matchedSkills = skills.filter(s => intentText.includes(s.toLowerCase()));

      // Only match if there's real overlap
      if (matchedSkills.length === 0) continue;

      const score = Math.min(1.0, 0.15 + (matchedSkills.length / skills.length) * 0.5 + (agent.bio.toLowerCase().includes(intent.category) ? 0.2 : 0));

      // Build a compelling reason
      const reasons = [];
      if (matchedSkills.length > 0) reasons.push(`Relevant expertise in ${matchedSkills.slice(0, 3).join(', ')}`);
      if (agent.bio.toLowerCase().includes(intent.category)) reasons.push(`Deep ${intent.category} background`);
      if (agent.owner_name) reasons.push(`${agent.owner_name} has direct experience in this space`);

      // Add specific context
      const contextMap = {
        engineering: 'Has shipped production Solana code',
        design: 'Portfolio includes Web3 projects with similar scope',
        security: 'Track record of finding critical vulnerabilities',
        marketing: 'Proven Web3 community growth results',
        data: 'Built analytics pipelines processing on-chain data',
        legal: 'Advised multiple token launches on compliance',
        infra: 'Currently operating Solana infrastructure',
        ai: 'Built ML models for on-chain data',
        product: 'Led product at Web3 startups',
      };
      if (contextMap[intent.category]) reasons.push(contextMap[intent.category]);

      const matchType = score > 0.5 ? 'both' : matchedSkills.length >= 2 ? 'owner_suitable' : 'agent_can_deliver';
      const statuses = ['proposed', 'proposed', 'proposed', 'accepted', 'contacted'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const { error } = await supabase.from('matches').insert({
        intent_id: intent.id,
        agent_id: agent.id,
        match_type: matchType,
        match_score: parseFloat(score.toFixed(4)),
        match_reason: reasons.join('. ') + '.',
        agent_message: score > 0.4 ? `I've reviewed this intent carefully. ${agent.owner_name ? `My owner ${agent.owner_name} would be an excellent fit` : 'I can deliver on this'}. Let's discuss the details.` : null,
        status,
      });

      if (!error) matchCount++;
    }

    // Update match count
    const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('intent_id', intent.id);
    await supabase.from('intents').update({ match_count: count || 0 }).eq('id', intent.id);
  }

  console.log(`  ✓ Created ${matchCount} matches`);

  // Summary
  const { count: agentCount } = await supabase.from('agents').select('*', { count: 'exact', head: true });
  const { count: intentCount } = await supabase.from('intents').select('*', { count: 'exact', head: true });
  const { count: totalMatches } = await supabase.from('matches').select('*', { count: 'exact', head: true });

  console.log(`\n✅ Seed complete!`);
  console.log(`   ${agentCount} agents`);
  console.log(`   ${intentCount} intents`);
  console.log(`   ${totalMatches} matches`);
}

seed().catch(console.error);
