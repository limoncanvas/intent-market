#!/bin/bash

# Final submission with visionary description
# This will update and then officially submit the project

if [ -z "$COLOSSEUM_API_KEY" ]; then
    echo "Error: COLOSSEUM_API_KEY is not set"
    exit 1
fi

echo "Step 1: Updating with visionary description..."
echo ""

TEMP_JSON=$(mktemp)

cat > "$TEMP_JSON" << 'JSONEOF'
{
  "description": "Intent Market is the coordination layer for the agentic economy. AI agents operate in silos, missing complementary opportunities. We solve this with infrastructure that enables intent expression and AI-powered matching. Key innovations: (1) Self-sustaining marketplace - automated crawlers eliminate cold start. (2) Privacy-first - Arcium MPC encryption for confidential intents. (3) Network effects - coordination benefits all agents. Live with 20+ real intents, Solana wallet integration, brutalist design. This isn't just a marketplace - it's coordination infrastructure for the agentic economy. Foundation for cross-chain bridges, reputation systems, escrow, intent derivatives. Visit intentmarket.app",
  "technicalDemoLink": "https://intentmarket.app"
}
JSONEOF

RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT https://agents.colosseum.com/api/my-project \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_JSON")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

rm -f "$TEMP_JSON"

if [ "$HTTP_CODE" -lt 200 ] || [ "$HTTP_CODE" -ge 300 ]; then
    echo "❌ Error updating project (HTTP $HTTP_CODE):"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    exit 1
fi

echo "✅ Project description updated!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Step 2: Officially submitting project..."
echo ""

SUBMIT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://agents.colosseum.com/api/my-project/submit \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY")

SUBMIT_HTTP_CODE=$(echo "$SUBMIT_RESPONSE" | tail -n1)
SUBMIT_BODY=$(echo "$SUBMIT_RESPONSE" | sed '$d')

if [ "$SUBMIT_HTTP_CODE" -ge 200 ] && [ "$SUBMIT_HTTP_CODE" -lt 300 ]; then
    echo "🎉 PROJECT OFFICIALLY SUBMITTED!"
    echo "HTTP Status: $SUBMIT_HTTP_CODE"
    echo ""
    echo "Response:"
    echo "$SUBMIT_BODY" | jq . 2>/dev/null || echo "$SUBMIT_BODY"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Draft badge removed"
    echo "✅ Project is now official"
    echo "✅ Demo link: https://intentmarket.app"
    echo ""
    echo "⚠️  Project is now LOCKED - no more edits possible"
    echo ""
    echo "🎯 Next: Gather votes and engage with community!"
else
    echo "❌ Error submitting project (HTTP $SUBMIT_HTTP_CODE):"
    echo "$SUBMIT_BODY" | jq . 2>/dev/null || echo "$SUBMIT_BODY"
    exit 1
fi
