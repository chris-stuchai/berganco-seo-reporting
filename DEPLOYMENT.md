# Railway Deployment Guide

This guide walks you through deploying the BerganCo SEO Reporting system to Railway.

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- Google Search Console API credentials (see main README)
- Resend API key for emails ([resend.com](https://resend.com))

## Quick Deploy (5 minutes)

### Step 1: Create Railway Project

\`\`\`bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init
\`\`\`

When prompted:
- Project name: `berganco-seo-reporting`
- Select: Create new project

### Step 2: Add PostgreSQL Database

\`\`\`bash
railway add
\`\`\`

Select: **PostgreSQL**

Railway will automatically:
- Provision a PostgreSQL database
- Set `DATABASE_URL` environment variable

### Step 3: Set Environment Variables

\`\`\`bash
# Google Search Console
railway variables set GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
railway variables set GOOGLE_CLIENT_SECRET="your-client-secret"
railway variables set GOOGLE_REDIRECT_URI="https://your-app.railway.app/oauth2callback"
railway variables set GOOGLE_REFRESH_TOKEN="your-refresh-token"

# Site Configuration
railway variables set SITE_URL="https://www.berganco.com"

# Email Configuration
railway variables set RESEND_API_KEY="re_your_api_key"
railway variables set REPORT_EMAIL_TO="client@email.com"
railway variables set REPORT_EMAIL_FROM="seo-reports@yourdomain.com"

# App Configuration
railway variables set NODE_ENV="production"
\`\`\`

### Step 4: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth credentials
3. Add Railway URL to authorized redirect URIs:
   - `https://berganco-seo-reporting.up.railway.app/oauth2callback`
   - (Replace with your actual Railway URL)

### Step 5: Deploy

\`\`\`bash
railway up
\`\`\`

Railway will:
1. Build your TypeScript code (`npm run build`)
2. Run Prisma migrations automatically
3. Start the server (`npm start`)

### Step 6: Run Initial Data Collection

After deployment, trigger the backfill:

\`\`\`bash
# Via Railway CLI
railway run npm run collect backfill 30
\`\`\`

Or visit your app's URL and use the dashboard's "Collect Data" button.

### Step 7: Test the System

1. Visit your Railway URL (e.g., `https://berganco-seo-reporting.up.railway.app`)
2. Check the dashboard loads with data
3. Manually trigger a report: Click "Generate Report"
4. Verify email arrives

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | Auto-set by Railway |
| `GOOGLE_CLIENT_ID` | OAuth2 Client ID | Yes | `123-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Client Secret | Yes | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | Yes | `https://your-app.railway.app/oauth2callback` |
| `GOOGLE_REFRESH_TOKEN` | OAuth refresh token | Yes | Run `npm run setup` locally |
| `SITE_URL` | Website to monitor | Yes | `https://www.berganco.com` |
| `RESEND_API_KEY` | Resend API key | Yes | `re_...` |
| `REPORT_EMAIL_TO` | Report recipient | Yes | `client@email.com` |
| `REPORT_EMAIL_FROM` | Report sender | Yes | `seo@yourdomain.com` |
| `NODE_ENV` | Environment | No | `production` |
| `PORT` | Server port | No | Auto-set by Railway |

## Railway Configuration

The `railway.json` file configures:

\`\`\`json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
\`\`\`

## Scheduled Jobs in Production

The app runs two cron jobs automatically:

### Daily Data Collection
- **Schedule:** 3:00 AM daily
- **What it does:** Collects previous day's metrics from Google Search Console
- **View logs:** `railway logs` (filter for "scheduled data collection")

### Weekly Reports
- **Schedule:** Monday 8:00 AM
- **What it does:** Generates report, sends email
- **View logs:** `railway logs` (filter for "scheduled weekly report")

## Manual Operations on Railway

### View Logs
\`\`\`bash
railway logs
\`\`\`

### Run Commands
\`\`\`bash
# Collect data manually
railway run npm run collect

# Generate report manually
railway run npm run report

# Backfill historical data
railway run npm run collect backfill 30
\`\`\`

### Database Access
\`\`\`bash
# Connect to PostgreSQL
railway connect postgres
\`\`\`

### Restart Service
\`\`\`bash
railway restart
\`\`\`

## Monitoring & Health Checks

### Health Endpoint
Your app exposes a health check at:
\`\`\`
https://your-app.railway.app/health
\`\`\`

Returns:
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2025-01-30T12:00:00.000Z"
}
\`\`\`

### Check App Status
\`\`\`bash
railway status
\`\`\`

## Troubleshooting

### Build Fails

**Error:** "Module not found"
\`\`\`bash
# Clear Railway build cache
railway down
railway up --force
\`\`\`

**Error:** "TypeScript compilation failed"
- Check `tsconfig.json` is correct
- Ensure all dependencies are in `package.json` (not just devDependencies)

### Migration Fails

**Error:** "Can't reach database"
- Verify PostgreSQL service is running in Railway dashboard
- Check `DATABASE_URL` is set correctly

**Solution:**
\`\`\`bash
railway run npm run migrate
\`\`\`

### Cron Jobs Not Running

**Issue:** Reports not being sent

1. Check Railway logs: `railway logs`
2. Look for cron execution messages
3. Verify time zone (Railway uses UTC)
4. Manual test: `railway run npm run report`

### Email Not Sending

**Error:** "Invalid API key"
- Verify `RESEND_API_KEY` is correct
- Check sender email is verified in Resend dashboard

**Error:** "Sender not authorized"
- Verify domain in Resend
- Use email address from verified domain

### No Data in Dashboard

1. **Check data collection ran:**
   \`\`\`bash
   railway logs | grep "Data collection"
   \`\`\`

2. **Manually trigger backfill:**
   \`\`\`bash
   railway run npm run collect backfill 30
   \`\`\`

3. **Check Google API credentials:**
   - Refresh token valid?
   - Search Console API enabled?
   - Redirect URI matches Railway URL?

## Updating the App

### Deploy New Changes

\`\`\`bash
# Commit your changes
git add .
git commit -m "Update SEO reporting"

# Deploy to Railway
railway up
\`\`\`

### Database Schema Changes

If you modify `prisma/schema.prisma`:

\`\`\`bash
# Generate migration locally
npx prisma migrate dev --name your_migration_name

# Commit the migration files
git add prisma/migrations
git commit -m "Add migration"

# Deploy
railway up

# Migration runs automatically on deploy
\`\`\`

## Cost Estimation

Railway Pricing (as of 2025):
- **Hobby Plan:** $5/month
  - Includes: 500 hours/month execution time
  - PostgreSQL: Included
  - Perfect for this project

- **Usage:** This app typically uses ~50 hours/month
  - Daily data collection: ~5 min/day = 2.5 hours/month
  - Weekly reports: ~2 min/week = 0.25 hours/month
  - Server running: Minimal usage (mostly idle)

**Recommendation:** Hobby plan is perfect for this use case.

## Security Best Practices

1. **Never expose refresh tokens**
   - Use Railway's environment variables
   - Don't log them in console

2. **Rotate API keys regularly**
   - Google OAuth tokens
   - Resend API keys

3. **Use Railway's secret management**
   - All sensitive data in environment variables
   - Never commit to Git

4. **Restrict OAuth redirect URIs**
   - Only add your production Railway URL
   - Remove localhost URLs in production

5. **Monitor access logs**
   \`\`\`bash
   railway logs | grep "POST\|GET"
   \`\`\`

## Domain Setup (Optional)

To use a custom domain like `seo-reports.berganco.com`:

1. Go to Railway dashboard → Your project → Settings
2. Click "Domains"
3. Add custom domain
4. Update DNS records (Railway provides instructions)
5. Update `GOOGLE_REDIRECT_URI` with new domain
6. Update Google OAuth redirect URIs

## Backup Strategy

### Database Backups

Railway automatically backs up PostgreSQL.

**Manual backup:**
\`\`\`bash
railway run pg_dump $DATABASE_URL > backup.sql
\`\`\`

### Environment Variables Backup

Export all variables:
\`\`\`bash
railway variables > railway-env.txt
\`\`\`

**⚠️ Keep this file secure!**

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Run initial backfill
3. ✅ Test weekly report generation
4. ✅ Share dashboard URL with client
5. ✅ Monitor logs for first week
6. ✅ Set up custom domain (optional)
7. ✅ Schedule regular check-ins

---

**Questions?** Check Railway docs: [docs.railway.app](https://docs.railway.app)

