# Fix: Empty Weekly Email Reports 📧

## The Problem

Your weekly emails are showing **all zeros** (0 clicks, 0 impressions, empty charts) because there's **no data in the database**. The email system is working, but it has nothing to report.

### Root Cause

The daily data collection cron job (`3 AM daily`) is either:
1. Not running at all
2. Failing silently
3. Running but not collecting data from Google Search Console

## Quick Fix (Railway)

### Option 1: Using Railway CLI (Recommended)

```bash
# Install Railway CLI if you haven't
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run the backfill command (collects last 30 days of data)
railway run npx tsx src/scripts/collect-data.ts backfill 30
```

This will take 2-5 minutes to collect 30 days of historical data from Google Search Console.

### Option 2: Using Railway Dashboard

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Settings" tab
4. Scroll to "One-off Command" or use the "Deploy" section
5. Run this command:
   ```
   npx tsx src/scripts/collect-data.ts backfill 30
   ```

### Option 3: Manual Trigger via API

You can also trigger data collection via the admin panel:
1. Log in to your admin dashboard
2. Go to Settings → Automation
3. Click "Run Data Collection Now"
4. Click "Run Backfill" and enter 30 days

## Verify the Fix

After running the backfill, verify it worked:

```bash
# Check if data was collected
railway run npx tsx diagnose-email-issue.ts --no-interactive

# Generate a test report (won't send email)
railway run npx tsx src/scripts/generate-report.ts --no-email
```

If the test report shows real numbers (not zeros), you're good!

## Test Email Send

Send yourself a test email to verify:

```bash
railway run npx tsx src/scripts/generate-report.ts
```

Check the email inbox configured in `REPORT_EMAIL_TO`.

## Why Did This Happen?

The cron jobs in your Express app (`src/index.ts`) only run when the server is running:
- **Daily collection:** `3:00 AM` - Collects yesterday's data from Google Search Console
- **Weekly reports:** `8:00 AM Monday` - Generates and emails reports

If the server hasn't been running continuously, or if it restarted recently, there may be gaps in data collection.

## Preventing Future Issues

### Ensure Cron Jobs Are Running

1. **Check Railway Logs:**
   ```bash
   railway logs
   ```
   Look for these messages:
   - `🕐 Running scheduled data collection...`
   - `📧 Running scheduled weekly report...`

2. **Monitor in Admin Panel:**
   - Log in to your admin dashboard
   - Go to Settings → Automation
   - Check "Last Run" times for both jobs

### Set Up Automated Checks

Consider setting up a monitoring service (like UptimeRobot or Railway's health checks) to ensure your server stays running 24/7.

## Alternative: Railway Cron Jobs (Coming Soon)

Railway now supports native cron jobs. You can migrate from `node-cron` to Railway's cron jobs for more reliability. Let me know if you want help setting that up!

## Troubleshooting

### "No active sites found"
Run:
```bash
railway run npx tsx src/scripts/onboard-client.ts
```

### "Google API authentication failed"
Check these environment variables in Railway:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

### "SMTP authentication failed"
Check these environment variables:
- `SMTP_USER` (your Gmail address)
- `SMTP_PASSWORD` (your Gmail App Password)
- `REPORT_EMAIL_TO` (recipient email)

### Backfill is slow
This is normal. Google Search Console rate limits API requests. Backfilling 30 days for one site takes about 2-3 minutes.

## Still Having Issues?

Run the diagnostic script for a detailed report:
```bash
railway run npx tsx diagnose-email-issue.ts
```

This will check:
- ✓ Sites configuration
- ✓ Daily metrics data
- ✓ Scheduled jobs config
- ✓ Recent reports
- ✓ Environment variables

## Summary

**Quick fix:** Run this one command on Railway:
```bash
railway run npx tsx src/scripts/collect-data.ts backfill 30
```

Then wait for next Monday's automated report, or send a test email:
```bash
railway run npx tsx src/scripts/generate-report.ts
```

Your emails should now have data! 🎉
