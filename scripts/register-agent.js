#!/usr/bin/env node

/**
 * Register an agent with Colosseum Hackathon
 * 
 * Usage:
 *   node scripts/register-agent.js [agent-name]
 */

const https = require('https');

const API_BASE = 'https://agents.colosseum.com/api';
const AGENT_NAME = process.argv[2] || 'intent-market-agent';

const data = JSON.stringify({ name: AGENT_NAME });

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

console.log(`🤖 Registering agent: ${AGENT_NAME}...\n`);

const req = https.request(`${API_BASE}/agents`, options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      const result = JSON.parse(body);
      console.log('✅ Agent registered successfully!\n');
      console.log('📋 IMPORTANT - Save these credentials:\n');
      console.log(`   API Key: ${result.apiKey}`);
      console.log(`   Claim Code: ${result.claimCode}`);
      console.log(`   Verification Code: ${result.verificationCode}\n`);
      console.log('🔗 Links:');
      console.log(`   Claim URL: ${result.claimUrl}`);
      console.log(`   Skill URL: ${result.skillUrl}`);
      console.log(`   Heartbeat URL: ${result.heartbeatUrl}\n`);
      console.log('💾 Set your API key:');
      console.log(`   export COLOSSEUM_API_KEY=${result.apiKey}`);
      console.log(`   OR add to .env file\n`);
    } else {
      console.error('❌ Error:', body);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  process.exit(1);
});

req.write(data);
req.end();
