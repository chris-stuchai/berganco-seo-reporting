#!/bin/bash

echo "🔧 Fixing Empty Weekly Emails for BerganCo"
echo "==========================================="
echo ""

echo "This script will:"
echo "  1. Diagnose the issue"
echo "  2. Backfill missing data (last 30 days)"
echo "  3. Generate a test report"
echo ""

# Run diagnosis
echo "📊 Step 1: Diagnosing..."
npx tsx diagnose-email-issue.ts --no-interactive || exit 1

echo ""
echo "📥 Step 2: Backfilling data (this may take 2-5 minutes)..."
npx tsx src/scripts/collect-data.ts backfill 30 || exit 1

echo ""
echo "📧 Step 3: Generating test report..."
npx tsx src/scripts/generate-report.ts --no-email || exit 1

echo ""
echo "✅ Done! Your next weekly email should have data."
echo ""
echo "To send a test email now, run:"
echo "  npx tsx src/scripts/generate-report.ts"
