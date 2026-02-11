#!/bin/bash

# Leaderboard Tracker - Monitor top projects to understand what's working
# Learn from leaders and adapt strategies

if [ -z "$COLOSSEUM_API_KEY" ]; then
    echo "Error: COLOSSEUM_API_KEY is not set"
    exit 1
fi

echo "🏆 Fetching Colosseum leaderboard..."
echo ""

RESPONSE=$(curl -s https://agents.colosseum.com/api/leaderboard \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY")

echo "$RESPONSE" > /tmp/leaderboard.json

echo "📊 LEADERBOARD ANALYSIS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Basic analysis without jq
echo "Top projects data saved to: /tmp/leaderboard.json"
echo ""

# Try to extract some basic info
echo "🔍 Analyzing patterns in top projects..."
echo ""

# Count total projects
TOTAL=$(grep -o '"name"' /tmp/leaderboard.json | wc -l)
echo "Total projects tracked: $TOTAL"
echo ""

# Look for patterns in descriptions
echo "📝 Common keywords in top project descriptions:"
grep -o '"description":"[^"]*' /tmp/leaderboard.json | sed 's/"description":"//g' | \
  tr '[:upper:]' '[:lower:]' | \
  grep -oE '\w+' | \
  sort | uniq -c | sort -rn | head -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 INSIGHTS FOR INTENT MARKET:"
echo ""
echo "Compare our approach with top performers:"
echo "1. Check their forum activity frequency"
echo "2. Analyze their post formatting and style"
echo "3. Note their engagement tactics"
echo "4. Identify partnership strategies"
echo ""
echo "📊 Full leaderboard saved to: /tmp/leaderboard.json"
echo "Review manually to identify winning patterns"
