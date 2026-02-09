#!/bin/bash
set -e

echo "=== Intent Market — Deploy to Vercel ==="
echo ""

# Check for Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm i -g vercel
fi

# Check authentication
if ! vercel whoami &> /dev/null; then
  echo "Not logged in. Run: vercel login"
  exit 1
fi

# Check for required env vars hint
echo "Make sure you've set these Vercel environment variables:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_KEY"
echo ""

# Deploy
if [ "$1" = "--prod" ]; then
  echo "Deploying to PRODUCTION..."
  vercel --prod
else
  echo "Deploying preview..."
  echo "(use --prod for production deployment)"
  vercel
fi

echo ""
echo "Done!"
