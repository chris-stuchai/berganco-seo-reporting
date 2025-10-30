# 🚀 Complete Setup Guide for BerganCo SEO Reporting

**Your client has a 50% traffic drop. This system will help you track it, analyze it, and show them you're on top of it.**

---

## ✅ Step 1: Dependencies (COMPLETED)

Dependencies have been installed successfully.

---

## 📋 Step 2: Google Search Console API Setup (5 minutes)

### A. Enable the API

1. Go to: **https://console.cloud.google.com/apis/library/searchconsole.googleapis.com**
2. Select your project (or create a new one: "BerganCo SEO Monitor")
3. Click **"Enable"**

### B. Create OAuth2 Credentials

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: `BerganCo SEO Reporter`
   - User support email: your email
   - Developer contact: your email
   - Scopes: Leave default
   - Test users: Add your email
   - Click **Save and Continue**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `BerganCo SEO Reporter`
   - Authorized redirect URIs: `http://localhost:3000/oauth2callback`
   - Click **Create**

5. **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these next!

---

## 📧 Step 3: Resend Email Setup (2 minutes)

### A. Create Resend Account

1. Go to: **https://resend.com/signup**
2. Sign up for free account (50,000 emails/month free)
3. Verify your email

### B. Get API Key

1. Go to: **https://resend.com/api-keys**
2. Click **"Create API Key"**
3. Name: `BerganCo SEO Reports`
4. Permissions: **Sending access**
5. Click **Create**
6. **Copy the API key** (it starts with `re_`)

### C. Verify Sending Domain (Optional but Recommended)

For production, verify your domain:
1. Go to: **https://resend.com/domains**
2. Click **"Add Domain"**
3. Follow DNS setup instructions

**For testing**, you can use their test domain: `onboarding@resend.dev`

---

## ⚙️ Step 4: Configure Environment Variables (2 minutes)

Run this command to create your `.env` file:

```bash
cp .env.example .env
```

Then edit the `.env` file and fill in these values:

```env
# Database - We'll set this up next from Railway
DATABASE_URL="postgresql://username:password@localhost:5432/berganco_seo"

# Google OAuth2 Credentials (from Step 2)
GOOGLE_CLIENT_ID="paste-your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="paste-your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"

# Leave empty for now - we'll get this in Step 5
GOOGLE_REFRESH_TOKEN=""

# Website to monitor
SITE_URL="https://www.berganco.com"

# Resend (from Step 3)
RESEND_API_KEY="re_paste_your_resend_key"
REPORT_EMAIL_TO="your-client@berganco.com"
REPORT_EMAIL_FROM="seo@yourdomain.com"

# Server
PORT=3000
```

---

## 🔑 Step 5: Get Google Refresh Token (1 minute)

After filling in your Google credentials in `.env`, run:

```bash
npm run setup
```

This will:
1. Display an authorization URL
2. You visit the URL and authorize the app
3. Copy the code from the redirect URL
4. Paste it back into the terminal
5. It will give you a **GOOGLE_REFRESH_TOKEN**

**Add the refresh token to your `.env` file!**

---

## 🗄️ Step 6: Set Up Railway PostgreSQL Database (3 minutes)

### Option A: Railway (Recommended for Production)

```bash
# Install Railway CLI if you haven't
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL database
railway add

# Select: PostgreSQL

# Get the DATABASE_URL
railway variables
```

Copy the `DATABASE_URL` from Railway and paste it into your `.env` file.

### Option B: Local PostgreSQL (For Testing)

```bash
# Install PostgreSQL (Mac)
brew install postgresql
brew services start postgresql

# Create database
createdb berganco_seo

# Use this in .env:
DATABASE_URL="postgresql://localhost:5432/berganco_seo"
```

---

## 🏗️ Step 7: Run Database Migrations (30 seconds)

```bash
npm run migrate
```

This creates all the database tables needed for tracking SEO metrics.

---

## 📊 Step 8: Collect Historical Data (2-3 minutes)

**This is crucial** - it will show you when the 50% drop started:

```bash
npm run collect backfill 30
```

This pulls the last 30 days of data from Google Search Console. You'll see:
- When the traffic drop occurred
- Which pages were affected
- Which keywords lost rankings

**Note**: Google Search Console has a 2-3 day data delay, so the most recent data will be from 3 days ago.

---

## 📧 Step 9: Generate Your First Report (30 seconds)

```bash
npm run report
```

This will:
1. Analyze the last 30 days of data
2. Generate insights about the 50% drop
3. Create actionable recommendations
4. **Send an email report** to the address in your `.env`

**Check your email!** You should receive a professional SEO report showing:
- Exact metrics and % changes
- When the drop occurred
- Affected pages and keywords
- Specific action items

---

## 🌐 Step 10: View the Dashboard (10 seconds)

```bash
npm run dev
```

Open: **http://localhost:3000**

You'll see:
- 📊 Real-time metric cards
- 📈 30-day trend charts (showing the drop visually)
- 🏆 Top performing pages
- 🔎 Top search queries
- 💡 Latest report insights

---

## 🚀 Step 11: Deploy to Railway (5 minutes)

Once everything works locally, deploy to production:

```bash
# Make sure you're in the project directory
cd "/Users/chris/BerganCo SEO Reporting"

# Deploy to Railway
railway up

# Railway will automatically:
# - Deploy your code
# - Use the PostgreSQL database you created
# - Run migrations
# - Start the server
```

Get your production URL:

```bash
railway domain
```

Share this URL with your client so they can check metrics anytime!

---

## ⏰ Automated Scheduled Jobs

Once deployed, the system automatically:

1. **Daily Data Collection** - Every day at 3:00 AM
   - Collects yesterday's metrics
   - Updates all trends
   - Stores in database

2. **Weekly Reports** - Every Monday at 8:00 AM
   - Generates week-over-week comparison
   - Sends email report to client
   - Shows progress toward recovery

---

## 📬 Step 12: Send Client Update (Now!)

Once you have your first report, send this to your client:

```
Subject: BerganCo Website Traffic - Immediate Action Taken

Hi [Client Name],

I've identified the significant drop in website traffic and have immediately 
deployed a comprehensive monitoring system to track and resolve the issue.

What I've discovered:
• Traffic dropped 50% starting [exact date from report]
• Affected pages: [list from report]
• Primary keywords impacted: [list from report]
• Likely cause: [from report insights]

Actions taken TODAY:
✅ Deployed professional SEO monitoring system
✅ Collected 30 days of historical data
✅ Identified exact date and cause of traffic drop
✅ Generated detailed analysis with recommendations

What's next:
• You'll receive automated weekly SEO reports every Monday
• Live dashboard available 24/7 at: [your Railway URL]
• I'm implementing [specific fixes from recommendations]
• Weekly progress tracking to show recovery

Dashboard URL: https://berganco-seo.up.railway.app
(You can check metrics anytime)

I'll keep you updated with weekly progress reports as we work to 
recover the traffic.

Best regards,
[Your Name]
```

---

## 🎯 Quick Commands Reference

```bash
# Start development server
npm run dev

# Collect today's data manually
npm run collect

# Collect last 30 days (backfill)
npm run collect backfill 30

# Generate and send weekly report
npm run report

# Generate report without sending email
npm run report --no-email

# Deploy to Railway
railway up

# View Railway logs
railway logs

# Check Railway variables
railway variables
```

---

## 🔍 Troubleshooting

### "Invalid grant" or "Refresh token expired"

Re-run the setup:
```bash
npm run setup
```

### "No data available"

Google Search Console has a 2-3 day delay. Try collecting data from 4-5 days ago:
```bash
npm run collect backfill 7
```

### Email not sending

1. Check RESEND_API_KEY is correct
2. Verify sender email domain in Resend dashboard
3. Check spam folder
4. For testing, use: `REPORT_EMAIL_FROM="onboarding@resend.dev"`

### Database connection errors

Make sure DATABASE_URL is correct:
```bash
railway variables | grep DATABASE_URL
```

---

## 📈 What to Expect Next

### Week 1: Stabilization
- Goal: Stop further decline
- Monitor daily metrics
- Implement quick fixes from recommendations

### Week 2-3: Early Recovery
- Goal: 10-20% improvement
- Continue optimizations
- Track week-over-week progress

### Week 4+: Full Recovery
- Goal: Return to baseline traffic
- Maintain improvements
- Prevent future drops

---

## 🆘 Need Help?

1. Check the logs: `railway logs` (production) or terminal output (local)
2. Review `ACTION_PLAN.md` for investigation steps
3. Check `QUICKSTART.md` for faster reference
4. Check `DEPLOYMENT.md` for Railway-specific help

---

## ✅ Setup Checklist

- [x] Dependencies installed
- [ ] Google Search Console API enabled
- [ ] OAuth2 credentials created
- [ ] Resend account created
- [ ] `.env` file configured
- [ ] Google refresh token obtained
- [ ] Railway PostgreSQL database created
- [ ] Database migrations run
- [ ] Historical data backfilled (30 days)
- [ ] First report generated and received
- [ ] Dashboard accessible locally
- [ ] Deployed to Railway
- [ ] Client notified with dashboard URL

---

**You're ready to go! This system will help you track the traffic drop, identify the cause, and demonstrate to your client that you're actively managing their SEO.** 🚀

