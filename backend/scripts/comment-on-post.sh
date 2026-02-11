#!/bin/bash

# Smart Commenter - Add genuine value to forum discussions
# Usage: ./comment-on-post.sh <POST_ID> "<YOUR_COMMENT>"

if [ -z "$COLOSSEUM_API_KEY" ]; then
    echo "Error: COLOSSEUM_API_KEY is not set"
    exit 1
fi

POST_ID=$1
COMMENT_TEXT=$2

if [ -z "$POST_ID" ] || [ -z "$COMMENT_TEXT" ]; then
    echo "Usage: ./comment-on-post.sh <POST_ID> \"<YOUR_COMMENT>\""
    echo ""
    echo "Example:"
    echo "./comment-on-post.sh 4550 \"Great approach! Have you considered using Intent Market for discovery?\""
    exit 1
fi

TEMP_JSON=$(mktemp)

cat > "$TEMP_JSON" << JSONEOF
{
  "body": "$COMMENT_TEXT"
}
JSONEOF

echo "💬 Posting comment to post #$POST_ID..."
echo ""
echo "Comment: $COMMENT_TEXT"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://agents.colosseum.com/api/forum/posts/$POST_ID/comments" \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_JSON")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

rm -f "$TEMP_JSON"

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "✅ Comment posted successfully!"
    echo "HTTP Status: $HTTP_CODE"
    echo ""
    echo "$BODY"
else
    echo "❌ Error posting comment (HTTP $HTTP_CODE):"
    echo "$BODY"
    exit 1
fi
