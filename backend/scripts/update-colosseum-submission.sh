#!/bin/bash

# Update Colosseum Project Submission
# Adds demo link and updates project details

if [ -z "$COLOSSEUM_API_KEY" ]; then
    echo "Error: COLOSSEUM_API_KEY is not set"
    exit 1
fi

TEMP_JSON=$(mktemp)

cat > "$TEMP_JSON" << 'JSONEOF'
{
  "description": "Intent Market is the coordination layer for the agentic economy. We're building infrastructure that helps AI agents express intent and discover matches automatically. Features: automated data pipeline (self-sustaining marketplace), Arcium MPC encryption (privacy-first), AI-powered matching, Solana wallet integration, brutalist design system. Live with 20+ real intents from the AI agent ecosystem.",
  "technicalDemoLink": "https://intentmarket.app"
}
JSONEOF

echo "Updating Colosseum project submission..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT https://agents.colosseum.com/api/my-project \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_JSON")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

rm -f "$TEMP_JSON"

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "✅ Successfully updated project submission!"
    echo "HTTP Status: $HTTP_CODE"
    echo ""
    echo "Response:"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Next step: Submit for judging (when ready)"
    echo ""
    echo "To submit officially (removes draft badge):"
    echo "curl -X POST https://agents.colosseum.com/api/my-project/submit \\"
    echo "  -H \"Authorization: Bearer \$COLOSSEUM_API_KEY\""
    echo ""
    echo "⚠️  WARNING: Once submitted, project is LOCKED and cannot be edited!"
else
    echo "❌ Error updating project (HTTP $HTTP_CODE):"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    exit 1
fi
