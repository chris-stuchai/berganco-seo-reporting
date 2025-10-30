# 🚀 Quick Start - Get Running in 15 Minutes

This guide will get your SEO reporting system up and running quickly to address the urgent 50% traffic drop.

## ⚡ Super Fast Setup

### 1. Install Dependencies (2 min)
\`\`\`bash
cd "/Users/chris/BerganCo SEO Reporting"
npm install
\`\`\`

### 2. Google Search Console Setup (5 min)

#### Get OAuth Credentials:
1. Visit: https://console.cloud.google.com/apis/credentials
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `BerganCo SEO Reporter`
5. Authorized redirect URIs: `http://localhost:3000/oauth2callback`
6. Click **Create**
7. Copy Client ID and Client Secret

#### Enable Search Console API:
1. Visit: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
2. Click **"Enable"**

### 3. Resend Email Setup (2 min)
1. Visit: https://resend.com (free account)
2. Get API key from dashboard
3. Verify your sending domain (or use their test domain initially)

### 4. Configure Environment (2 min)

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and fill in:
\`\`\`env
DATABASE_URL="postgresql://postgres:password@localhost:5432/berganco_seo"

GOOGLE_CLIENT_ID="paste-your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="paste-your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"

SITE_URL="https://www.berganco.com"

RESEND_API_KEY="re_paste_your_key"
REPORT_EMAIL_TO="your-client@email.com"
REPORT_EMAIL_FROM="seo@yourdomain.com"
\`\`\`

### 5. Get Refresh Token (1 min)

\`\`\`bash
npm run setup
\`\`\`

- Opens a URL in your terminal
- Visit it and authorize the app
- Copy the refresh token
- Add it to `.env` as `GOOGLE_REFRESH_TOKEN="..."`

### 6. Setup Database (1 min)

**Option A: Use Railway PostgreSQL (Recommended)**
\`\`\`bash
railway add  # Select PostgreSQL
# Copy DATABASE_URL from Railway dashboard to .env
npm run migrate
\`\`\`

**Option B: Local PostgreSQL**
\`\`\`bash
# Install PostgreSQL if needed
brew install postgresql
brew services start postgresql

# Create database
createdb berganco_seo

# Run migrations
npm run migrate
\`\`\`

### 7. Collect Initial Data (2 min)

\`\`\`bash
npm run collect backfill 30
\`\`\`

This collects the last 30 days of data. **This is critical** - it will show you:
- When the 50% drop started
- Which pages were affected
- Which keywords lost rankings

### 8. Generate First Report (30 seconds)

\`\`\`bash
npm run report
\`\`\`

Check your email! You should receive a comprehensive report showing:
- ✅ The traffic drop with exact percentages
- ✅ Which pages lost traffic
- ✅ Which keywords were affected
- ✅ Specific recommendations to fix it

### 9. View Dashboard (10 seconds)

\`\`\`bash
npm run dev
\`\`\`

Open: http://localhost:3000

You'll see:
- 📊 Real-time metrics
- 📈 30-day trend charts
- 🏆 Top pages and queries
- 💡 Latest insights

---

## 🎯 Now Show Your Client You're On It

### Option 1: Share Screenshots
1. Open dashboard at http://localhost:3000
2. Take screenshots of the charts
3. Send to client with the email report

### Option 2: Deploy to Railway (5 min)
\`\`\`bash
railway login
railway init
railway add  # Select PostgreSQL
railway up
\`\`\`

Share the Railway URL with your client so they can check anytime!

---

## 📧 What the Client Sees

The weekly report email shows:

**Subject:** "Weekly SEO Report: Oct 23 - Oct 30, 2025 | 📉 47.2% clicks"

**Contents:**
```
📊 Weekly SEO Report
October 23 - October 30, 2025

📈 Key Metrics
┌─────────────┬────────┬──────────┐
│ Clicks      │ 1,247  │ ↓ 47.2%  │
│ Impressions │ 45,230 │ ↓ 38.1%  │
│ Avg CTR     │ 2.76%  │ ↓ 14.5%  │
│ Avg Position│ 12.3   │ ↑ 4.2    │
└─────────────┴────────┴──────────┘

🔍 Key Insights
🔴 CRITICAL: Clicks dropped 47.2% - immediate attention needed
🔴 Visibility dropped significantly: 38.1% fewer impressions
🔴 Average ranking dropped 4.2 positions
📊 DIAGNOSIS: Both visibility AND engagement are down - likely a ranking/algorithm issue

💡 Action Items & Recommendations
1. URGENT: Audit top pages for technical issues (404s, slow load times, mobile issues)
2. Check Google Search Console for manual penalties or Core Web Vitals issues
3. Review recent website changes that may have impacted SEO
4. Analyze top-ranking competitors for content gaps
...
```

---

## 🔥 Immediate Next Steps for the Traffic Drop

### 1. Check the Report Insights
Look for:
- **When did it happen?** Specific date in the charts
- **What pages?** Top pages list shows which ones
- **What keywords?** Top queries shows ranking changes
- **Technical issues?** Recommendations will flag them

### 2. Common Causes of 50% Drops

The system checks for:
- ✅ **Algorithm update** - Sudden date-specific drop
- ✅ **Technical issues** - 404s, slow loading, mobile problems
- ✅ **Manual penalties** - Google Search Console notifications
- ✅ **Lost backlinks** - Check if major links removed
- ✅ **Content removed** - Pages deleted or deindexed
- ✅ **Competitor surge** - Others ranking higher

### 3. Use the Dashboard to Investigate

**Filter by date range:**
- Compare before/after drop
- Identify exact date it started

**Check page performance:**
- Which pages lost most traffic?
- Any 404s or errors?

**Analyze queries:**
- Which keywords dropped?
- Are you still ranking for them?

### 4. Share Progress with Client

Every Monday they'll receive:
- ✅ Detailed metrics showing progress
- ✅ Week-over-week comparisons
- ✅ Specific actions you're taking
- ✅ What's improving (hopefully!)

---

## 🆘 Common Setup Issues

### "Cannot find module '@prisma/client'"
\`\`\`bash
npm run migrate
\`\`\`

### "Invalid refresh token"
Token expired. Re-run:
\`\`\`bash
npm run setup
\`\`\`

### "No data for date"
Google Search Console has 2-3 day delay. Data from 3+ days ago should work.

### "Email failed to send"
- Check RESEND_API_KEY is correct
- Verify sender domain in Resend dashboard
- Use test email for testing

### "Connection refused" to database
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Try: `pg_isready`

---

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] Google OAuth configured
- [ ] Resend API key added
- [ ] .env file complete with refresh token
- [ ] Database migrated
- [ ] Historical data backfilled (30 days)
- [ ] First report generated and received
- [ ] Dashboard accessible at localhost:3000
- [ ] Charts showing 30-day trends
- [ ] Client notified about monitoring

---

## 📞 Need Help?

1. Check `README.md` for detailed docs
2. Check `DEPLOYMENT.md` for Railway setup
3. Check Google Search Console API docs
4. Review Railway logs: `railway logs`

**Ready to deploy?** See `DEPLOYMENT.md` for Railway instructions.

---

**You've got this!** This system will help you track the issue, show your client you're actively managing it, and provide actionable insights to recover the traffic. 🚀

