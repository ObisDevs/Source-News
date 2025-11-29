#!/bin/bash

# Test Cron Setup Script
# This script tests if your cron jobs are properly configured

echo "🔍 Testing Cron Job Setup..."
echo ""

# Check if VERCEL_URL is provided
if [ -z "$1" ]; then
  echo "❌ Error: Please provide your Vercel URL"
  echo "Usage: ./scripts/test-cron-setup.sh https://your-app.vercel.app"
  exit 1
fi

VERCEL_URL=$1
CRON_SECRET="8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"

echo "📍 Testing URL: $VERCEL_URL"
echo ""

# Test ingestion endpoint
echo "1️⃣ Testing /api/worker/ingest..."
INGEST_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$VERCEL_URL/api/worker/ingest" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

INGEST_BODY=$(echo "$INGEST_RESPONSE" | head -n -1)
INGEST_STATUS=$(echo "$INGEST_RESPONSE" | tail -n 1)

if [ "$INGEST_STATUS" = "200" ]; then
  echo "✅ Ingestion endpoint working (HTTP $INGEST_STATUS)"
  echo "Response: $INGEST_BODY" | jq '.' 2>/dev/null || echo "$INGEST_BODY"
else
  echo "❌ Ingestion endpoint failed (HTTP $INGEST_STATUS)"
  echo "Response: $INGEST_BODY"
fi

echo ""

# Test processing endpoint
echo "2️⃣ Testing /api/worker/process..."
PROCESS_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$VERCEL_URL/api/worker/process" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

PROCESS_BODY=$(echo "$PROCESS_RESPONSE" | head -n -1)
PROCESS_STATUS=$(echo "$PROCESS_RESPONSE" | tail -n 1)

if [ "$PROCESS_STATUS" = "200" ]; then
  echo "✅ Processing endpoint working (HTTP $PROCESS_STATUS)"
  echo "Response: $PROCESS_BODY" | jq '.' 2>/dev/null || echo "$PROCESS_BODY"
else
  echo "❌ Processing endpoint failed (HTTP $PROCESS_STATUS)"
  echo "Response: $PROCESS_BODY"
fi

echo ""

# Test without auth (should fail with 401)
echo "3️⃣ Testing authentication (should fail)..."
AUTH_TEST=$(curl -s -w "%{http_code}" -X POST "$VERCEL_URL/api/worker/ingest" \
  -H "Content-Type: application/json" \
  -o /dev/null)

if [ "$AUTH_TEST" = "401" ]; then
  echo "✅ Authentication working (correctly rejected unauthorized request)"
else
  echo "⚠️  Warning: Expected 401, got HTTP $AUTH_TEST"
fi

echo ""
echo "📋 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$INGEST_STATUS" = "200" ] && [ "$PROCESS_STATUS" = "200" ] && [ "$AUTH_TEST" = "401" ]; then
  echo "✅ All tests passed!"
  echo ""
  echo "Next steps:"
  echo "1. Update /migrations/fix_pg_cron.sql with your Vercel URL"
  echo "2. Run the SQL script in Supabase SQL Editor"
  echo "3. Wait 15 minutes and check cron.job_run_details table"
else
  echo "❌ Some tests failed. Check the errors above."
  echo ""
  echo "Common fixes:"
  echo "- Verify CRON_SECRET in Vercel environment variables"
  echo "- Ensure app is deployed to Vercel"
  echo "- Check Vercel logs for errors"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
