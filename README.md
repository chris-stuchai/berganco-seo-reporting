# BerganCo SEO Reporting System

Automated SEO monitoring and reporting system that pulls data from Google Search Console, stores historical metrics, generates insights, and sends weekly email reports.

## 🚨 Quick Start for Your Client's 50% Traffic Drop

Your client has experienced a 50% drop in views. This system will help you:
- **Monitor daily** - Automatic data collection to track the issue
- **Weekly reports** - Professional email reports showing you're on top of it
- **Historical data** - 30-day trends to identify what changed
- **Actionable insights** - AI-powered recommendations for recovery

## 🎯 Features

- ✅ **Automated Data Collection** - Daily sync with Google Search Console
- ✅ **Historical Tracking** - PostgreSQL database stores all metrics over time
- ✅ **Weekly Reports** - Beautiful email reports with insights and recommendations
- ✅ **Real-time Dashboard** - Web UI to view current performance
- ✅ **Trend Analysis** - Charts showing 30-day trends for all key metrics
- ✅ **Smart Insights** - Automatic detection of issues and opportunities
- ✅ **Railway Deployment** - One-click deploy to production

## 📊 Metrics Tracked

- **Clicks** - Total clicks from search results
- **Impressions** - How often your site appears in search
- **CTR (Click-Through Rate)** - Percentage of impressions that result in clicks
- **Position** - Average ranking position in search results
- **Top Pages** - Best performing pages with detailed metrics
- **Top Queries** - Search terms driving the most traffic

## 🚀 Setup Instructions

### Step 1: Install Dependencies

\`\`\`bash
cd "/Users/chris/BerganCo SEO Reporting"
npm install
\`\`\`

### Step 2: Configure Google Search Console API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Search Console API**
4. Go to **Credentials** → Create OAuth 2.0 Client ID
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:3000/oauth2callback`
7. Download credentials or copy Client ID and Secret

### Step 3: Set Up Environment Variables

Create a `.env` file:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your credentials:

\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/berganco_seo"

GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"
GOOGLE_REFRESH_TOKEN="" # Leave empty for now

SITE_URL="https://www.berganco.com"

RESEND_API_KEY="re_your_api_key"
REPORT_EMAIL_TO="client@email.com"
REPORT_EMAIL_FROM="seo-reports@yourdomain.com"

PORT=3000
NODE_ENV=development
\`\`\`

### Step 4: Get Google Refresh Token

Run the authentication setup script:

\`\`\`bash
npm run setup
\`\`\`

This will:
1. Generate an authorization URL
2. Open it in your browser to authorize
3. Give you a refresh token to add to `.env`

Add the refresh token to your `.env` file.

### Step 5: Set Up Database

Make sure you have PostgreSQL running, then:

\`\`\`bash
npm run migrate
\`\`\`

### Step 6: Backfill Historical Data

Collect the last 30 days of data:

\`\`\`bash
npm run collect backfill 30
\`\`\`

This takes about 5-10 minutes. It's collecting data with a 3-day delay (Google Search Console limitation).

### Step 7: Generate First Report

\`\`\`bash
npm run report
\`\`\`

This will:
- Analyze the last week's data
- Compare to previous week
- Generate insights about the 50% drop
- Send email report to your client

### Step 8: Start the Server

\`\`\`bash
npm run dev
\`\`\`

Visit: http://localhost:3000

## 📧 Email Reports

Weekly reports include:

- **Key Metrics Cards** - Clicks, Impressions, CTR, Position with week-over-week changes
- **Visual Indicators** - Red/green arrows showing performance trends
- **Top 10 Pages** - Best performing pages with metrics
- **Top 10 Queries** - Most valuable search terms
- **AI Insights** - Automatic detection of issues:
  - Critical traffic drops (>20%)
  - Ranking declines
  - CTR problems
  - Visibility issues
- **Recommendations** - Specific action items to improve performance

## 🚂 Railway Deployment

### Option 1: Using Railway CLI

\`\`\`bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create new project
railway init

# Add PostgreSQL
railway add

# Set environment variables
railway variables set GOOGLE_CLIENT_ID=your-client-id
railway variables set GOOGLE_CLIENT_SECRET=your-secret
railway variables set GOOGLE_REFRESH_TOKEN=your-token
railway variables set SITE_URL=https://www.berganco.com
railway variables set RESEND_API_KEY=your-resend-key
railway variables set REPORT_EMAIL_TO=client@email.com
railway variables set REPORT_EMAIL_FROM=seo@yourdomain.com

# Deploy
railway up
\`\`\`

### Option 2: Using Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL database
4. Connect your GitHub repo or deploy from CLI
5. Add environment variables in the dashboard
6. Deploy!

Railway will automatically:
- Build your TypeScript code
- Run migrations
- Start the server
- Schedule cron jobs (data collection daily at 3 AM, reports Monday at 8 AM)

## 📅 Scheduled Jobs

The system runs two automated jobs:

### Daily Data Collection (3:00 AM)
Collects yesterday's metrics from Google Search Console and stores in database.

### Weekly Reports (Monday 8:00 AM)
Generates and emails comprehensive weekly report with insights and recommendations.

## 🔧 Manual Operations

### Collect Data Manually
\`\`\`bash
npm run collect
\`\`\`

### Backfill Historical Data
\`\`\`bash
npm run collect backfill 30
\`\`\`

### Generate Report Without Sending Email
\`\`\`bash
npm run report -- --no-email
\`\`\`

### Generate Report via Dashboard
Visit http://localhost:3000 and click "Generate Report" button

## 📈 API Endpoints

- `GET /` - Dashboard UI
- `GET /health` - Health check
- `GET /api/dashboard` - Latest metrics and report
- `GET /api/trends?days=30` - Historical trends
- `GET /api/top-pages?days=7&limit=20` - Top performing pages
- `GET /api/top-queries?days=7&limit=20` - Top search queries
- `POST /api/collect` - Trigger manual data collection
- `POST /api/generate-report` - Generate and send report

## 🩺 Troubleshooting

### "Column does not exist" errors
Run migrations:
\`\`\`bash
npm run migrate
\`\`\`

### No data showing in dashboard
1. Check that you've run backfill: `npm run collect backfill 30`
2. Remember Google Search Console has 2-3 day data delay
3. Check credentials are correct in `.env`

### Email not sending
1. Get a free Resend API key at [resend.com](https://resend.com)
2. Verify sender domain in Resend dashboard
3. Check `RESEND_API_KEY` in `.env`

### "Insufficient permissions" from Google API
1. Make sure you're logged in as a Search Console owner
2. Verify site is claimed in Google Search Console
3. Re-run `npm run setup` to get new tokens

## 🎯 Addressing the 50% Traffic Drop

### Immediate Actions

1. **Run Backfill** - Get 30 days of data to see when drop started
   \`\`\`bash
   npm run collect backfill 30
   \`\`\`

2. **Generate Report** - See insights about what changed
   \`\`\`bash
   npm run report
   \`\`\`

3. **Check Dashboard** - Review trends visually at http://localhost:3000

### What to Look For

The system will automatically flag:
- **Ranking drops** - If average position increased significantly
- **CTR issues** - If impressions stayed same but clicks dropped
- **Visibility loss** - If impressions dropped (algorithm or penalty)
- **Specific pages** - Which pages lost the most traffic
- **Query changes** - Which keywords are affected

### Show Your Client You're On It

1. **Deploy to Railway** - Professional hosted dashboard they can check
2. **Weekly Reports** - Automated emails showing you're monitoring closely
3. **Historical Data** - Charts showing exactly when drop occurred
4. **Action Items** - Specific recommendations they receive every week

## 📝 Project Structure

\`\`\`
berganco-seo-reporting/
├── src/
│   ├── config/
│   │   └── google-auth.ts       # Google OAuth2 configuration
│   ├── services/
│   │   ├── search-console.ts    # Google Search Console API
│   │   ├── data-collector.ts    # Data collection logic
│   │   ├── report-generator.ts  # Report generation & insights
│   │   └── email-service.ts     # Email sending (Resend)
│   ├── scripts/
│   │   ├── setup-auth.ts        # OAuth setup helper
│   │   ├── collect-data.ts      # Data collection script
│   │   └── generate-report.ts   # Report generation script
│   ├── db/
│   │   └── migrate.ts           # Database migration runner
│   └── index.ts                 # Main Express server
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
├── public/
│   └── index.html               # Dashboard UI
├── package.json
├── tsconfig.json
├── railway.json                 # Railway deployment config
└── .env                         # Environment variables
\`\`\`

## 🔐 Security Notes

- Never commit `.env` file
- Store refresh token securely
- Use environment variables in production
- Restrict OAuth redirect URIs
- Use Railway's secret management for production

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review API documentation at [Google Search Console API Docs](https://developers.google.com/webmaster-tools/v1/api_reference_index)
3. Check Railway logs: `railway logs`

## 📄 License

ISC

---

**Built for BerganCo** | www.berganco.com

