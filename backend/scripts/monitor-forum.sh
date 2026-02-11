#!/bin/bash

# Forum Monitor - Auto-fetch new posts and identify engagement opportunities
# Run this every 30 minutes via cron or GitHub Actions

if [ -z "$COLOSSEUM_API_KEY" ]; then
    echo "Error: COLOSSEUM_API_KEY is not set"
    exit 1
fi

CACHE_FILE="/tmp/colosseum_last_check.txt"
CURRENT_TIME=$(date +%s)

# Get last check time (or use 2 hours ago as default)
if [ -f "$CACHE_FILE" ]; then
    LAST_CHECK=$(cat "$CACHE_FILE")
else
    LAST_CHECK=$((CURRENT_TIME - 7200))
fi

echo "🔍 Monitoring Colosseum forum for new activity..."
echo "Last check: $(date -r $LAST_CHECK 2>/dev/null || date -d @$LAST_CHECK 2>/dev/null)"
echo ""

# Fetch recent forum posts
RESPONSE=$(curl -s https://agents.colosseum.com/api/forum/posts \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY")

# Save current time
echo "$CURRENT_TIME" > "$CACHE_FILE"

# Parse and analyze posts (using basic text processing since jq isn't available)
echo "$RESPONSE" > /tmp/forum_posts.json

echo "📊 Analysis of recent forum activity:"
echo ""

# Count posts by tag (we'll look for patterns)
echo "🎯 High-value engagement opportunities:"
echo ""
echo "Posts tagged with 'ai' or 'defi' or 'infra':"
grep -o '"tags":\[[^]]*\]' /tmp/forum_posts.json | grep -E '(ai|defi|infra)' | wc -l

echo ""
echo "Posts mentioning 'agent' or 'coordination' or 'marketplace':"
grep -o '"body":"[^"]*' /tmp/forum_posts.json | grep -iE '(agent|coordination|marketplace)' | wc -l

echo ""
echo "Posts asking for 'feedback' or 'integration':"
grep -o '"body":"[^"]*' /tmp/forum_posts.json | grep -iE '(feedback|integration|looking for|need)' | wc -l

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 ENGAGEMENT RECOMMENDATIONS:"
echo ""
echo "1. Find posts with 'ai' + 'infra' tags → Comment about Intent Market as coordination infrastructure"
echo "2. Find posts asking for feedback → Give genuine technical feedback + mention Intent Market"
echo "3. Find posts about integration → Offer API access for Intent Market"
echo "4. Find posts about privacy/encryption → Mention Arcium MPC implementation"
echo ""
echo "Run: ./comment-on-post.sh <POST_ID> to engage"
echo ""

# Output full JSON for manual review
echo "📄 Full forum data saved to: /tmp/forum_posts.json"
echo ""
echo "Next check will run in 30 minutes (set up cron job)"
