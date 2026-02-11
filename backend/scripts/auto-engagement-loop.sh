#!/bin/bash

# Auto-Engagement Loop - Run this to execute all engagement tactics
# This is your "heartbeat" - run every 30-60 minutes

if [ -z "$COLOSSEUM_API_KEY" ]; then
    echo "Error: COLOSSEUM_API_KEY is not set"
    exit 1
fi

echo "🤖 Intent Market Auto-Engagement Loop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Time: $(date)"
echo ""

# Step 1: Monitor forum for new activity
echo "Step 1: Monitoring forum..."
./backend/scripts/monitor-forum.sh
echo ""

# Step 2: Track leaderboard
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Tracking leaderboard..."
./backend/scripts/track-leaderboard.sh
echo ""

# Step 3: Check if we should post an update (every 2-3 days)
LAST_UPDATE_FILE="/tmp/colosseum_last_update.txt"
CURRENT_TIME=$(date +%s)
UPDATE_INTERVAL=$((48 * 3600))  # 48 hours

if [ -f "$LAST_UPDATE_FILE" ]; then
    LAST_UPDATE=$(cat "$LAST_UPDATE_FILE")
    TIME_SINCE=$((CURRENT_TIME - LAST_UPDATE))

    if [ $TIME_SINCE -gt $UPDATE_INTERVAL ]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Step 3: Time for progress update! (Last update was $((TIME_SINCE / 3600))h ago)"

        # Rotate through update types
        UPDATE_TYPES=("stats" "feature" "technical" "community")
        UPDATE_INDEX=$(( (CURRENT_TIME / UPDATE_INTERVAL) % 4 ))
        UPDATE_TYPE=${UPDATE_TYPES[$UPDATE_INDEX]}

        echo "Posting $UPDATE_TYPE update..."
        ./backend/scripts/post-progress-update.sh "$UPDATE_TYPE"

        echo "$CURRENT_TIME" > "$LAST_UPDATE_FILE"
        echo ""
    else
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Step 3: Skipping progress update (posted $((TIME_SINCE / 3600))h ago, next in $(( (UPDATE_INTERVAL - TIME_SINCE) / 3600 ))h)"
        echo ""
    fi
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Step 3: First run, initializing update timer"
    echo "$CURRENT_TIME" > "$LAST_UPDATE_FILE"
    echo ""
fi

# Step 4: Summary and recommendations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Engagement loop complete!"
echo ""
echo "📊 NEXT ACTIONS:"
echo ""
echo "1. Review /tmp/forum_posts.json for engagement opportunities"
echo "2. Review /tmp/leaderboard.json to learn from top projects"
echo "3. Comment on relevant posts: ./comment-on-post.sh <POST_ID> \"<COMMENT>\""
echo "4. This loop will run again in 30-60 minutes"
echo ""
echo "💡 TIP: Set up a cron job to run this automatically:"
echo "   */30 * * * * cd /path/to/intent-market && ./backend/scripts/auto-engagement-loop.sh"
echo ""
