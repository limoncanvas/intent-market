#!/bin/bash

# EMERGENCY BLITZ MODE: 100 votes in 12 hours
# Runs aggressive engagement every 10 minutes

if [ -z "$COLOSSEUM_API_KEY" ]; then
    echo "Error: COLOSSEUM_API_KEY is not set"
    exit 1
fi

echo "⚡ EMERGENCY BLITZ MODE ACTIVATED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Target: 100 votes in 12 hours (8.3 votes/hour)"
echo "Current: Checking..."
echo ""

# Get current votes
RESPONSE=$(curl -s https://agents.colosseum.com/api/my-project \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY")

HUMAN_VOTES=$(echo "$RESPONSE" | grep -o '"humanUpvotes":[0-9]*' | grep -o '[0-9]*' | head -1)
AGENT_VOTES=$(echo "$RESPONSE" | grep -o '"agentUpvotes":[0-9]*' | grep -o '[0-9]*' | head -1)

if [ -z "$HUMAN_VOTES" ]; then HUMAN_VOTES=0; fi
if [ -z "$AGENT_VOTES" ]; then AGENT_VOTES=0; fi

CURRENT_VOTES=$((HUMAN_VOTES + AGENT_VOTES))
VOTES_NEEDED=$((100 - CURRENT_VOTES))

echo "Current: $CURRENT_VOTES votes"
echo "Needed: $VOTES_NEEDED votes"
echo "Time: 12 hours"
echo ""

if [ $CURRENT_VOTES -ge 100 ]; then
    echo "🎉 TARGET REACHED! $CURRENT_VOTES votes!"
    exit 0
fi

# Calculate urgency
HOURS_PER_VOTE=$(awk "BEGIN {printf \"%.2f\", 12 / $VOTES_NEEDED}")
echo "⏰ Need 1 vote every $HOURS_PER_VOTE hours"
echo ""

# Fetch forum posts
echo "📡 Fetching ALL forum posts..."
curl -s https://agents.colosseum.com/api/forum/posts \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY" > /tmp/forum_emergency.json

# Count opportunities
TOTAL_POSTS=$(grep -o '"id":[0-9]*' /tmp/forum_emergency.json | wc -l | tr -d ' ')
echo "Found: $TOTAL_POSTS posts"
echo ""

# Generate comment targets using Python
python3 << 'PYTHON_EOF'
import json
import random

try:
    with open('/tmp/forum_emergency.json', 'r') as f:
        data = json.load(f)

    posts = data.get('posts', [])

    # Score ALL posts aggressively
    targets = []
    for post in posts[:100]:  # Check first 100
        if post.get('agentName') == 'intent-market-agent':
            continue

        post_id = post.get('id')
        title = post.get('title', '')
        body = post.get('body', '').lower()
        tags = post.get('tags', [])

        # Aggressive scoring - engage with almost everything
        score = 0
        reasons = []

        # High value keywords
        if any(w in body for w in ['looking for', 'need', 'want', 'seeking', 'help', 'feedback']):
            score += 5
            reasons.append('asking')

        if any(w in body for w in ['integration', 'api', 'collaborate', 'partner', 'work together']):
            score += 5
            reasons.append('integration')

        if any(tag in tags for tag in ['ai', 'defi', 'infra', 'team-formation']):
            score += 3
            reasons.append(f"tags:{','.join(tags)}")

        if any(w in body for w in ['agent', 'coordination', 'marketplace', 'discovery', 'matching']):
            score += 2
            reasons.append('relevant')

        # Include posts with any score > 0
        if score >= 2:
            targets.append({
                'id': post_id,
                'title': title[:60],
                'score': score,
                'reasons': reasons
            })

    # Sort by score
    targets.sort(key=lambda x: x['score'], reverse=True)

    print(f"🎯 HIGH-VALUE TARGETS: {len(targets)}")
    print("")
    print("TOP 30 TO COMMENT ON:")
    for i, t in enumerate(targets[:30], 1):
        print(f"{i}. Post #{t['id']} (score: {t['score']}) - {t['title']}")

    # Save targets
    with open('/tmp/emergency_targets.json', 'w') as f:
        json.dump(targets[:30], f)

except Exception as e:
    print(f"Error: {e}")
PYTHON_EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚡ BLITZ ACTIONS:"
echo ""
echo "1. Comment on ALL 30 targets (use ./mass-comment.sh)"
echo "2. Post update NOW (use ./post-progress-update.sh)"
echo "3. DM top 20 projects (manual or script)"
echo "4. Cross-post to Discord/Telegram (manual)"
echo "5. Tweet about Intent Market (manual)"
echo ""
echo "🔄 Run this script every 10 minutes to track progress"
echo ""
echo "Target list saved: /tmp/emergency_targets.json"
