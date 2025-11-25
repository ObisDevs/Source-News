#!/bin/bash

# Script to reingest news and categorize all stories

echo "🔄 Starting news reingestion and categorization..."

# Get the CRON_SECRET from .env.local
if [ -f .env.local ]; then
  export $(grep CRON_SECRET .env.local | xargs)
fi

if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET not found in .env.local"
  exit 1
fi

# Step 1: Categorize existing stories
echo ""
echo "📊 Step 1: Categorizing existing stories..."
curl -X GET "http://localhost:3000/api/worker/categorize" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"

echo ""
echo ""

# Step 2: Ingest new stories
echo "📰 Step 2: Ingesting fresh news..."
curl -X GET "http://localhost:3000/api/worker/ingest" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "✅ Done! Check your app to see categorized news."
