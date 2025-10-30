# 🔗 Quick Links - Everything You Need

## 🎯 Setup Links (Do These First)

### 1. Google Search Console API
**Enable API:**
```
https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
```

**Create OAuth Credentials:**
```
https://console.cloud.google.com/apis/credentials
```
- Click: Create Credentials → OAuth client ID
- Type: Web application
- Redirect URI: `http://localhost:3000/oauth2callback`

---

### 2. Resend Email Service
**Sign Up:**
```
https://resend.com/signup
```

**Get API Key:**
```
https://resend.com/api-keys
```

**Add Domain (Optional):**
```
https://resend.com/domains
```

---

### 3. Railway (Database & Hosting)
**Railway Dashboard:**
```
https://railway.app
```

**Railway CLI Install:**
```bash
npm install -g @railway/cli
```

---

## 📚 Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **START_HERE.md** | Overview of entire system | First time? Start here |
| **NEXT_STEPS.md** | Step-by-step setup checklist | Ready to set up? Go here |
| **SETUP_GUIDE.md** | Detailed instructions | Need more details |
| **GET_STARTED.md** | Quick 10-minute guide | Want speed? This |
| **CLIENT_EMAIL_TEMPLATE.md** | Pre-written client emails | Time to email client |
| **ACTION_PLAN.md** | Traffic recovery strategy | Planning fixes |
| **DEPLOYMENT.md** | Railway deployment help | Deploying to production |
| **README.md** | Technical documentation | Full system docs |
| **QUICKSTART.md** | Alternative quick start | Another quick option |

---

## ⚡ Command Reference

### Setup Commands
```bash
# Install dependencies (already done)
npm install

# Get Google refresh token
npm run setup

# Run database migrations
npm run migrate
```

### Data Collection
```bash
# Collect today's data
npm run collect

# Collect last 30 days (DO THIS FIRST!)
npm run collect backfill 30

# Collect last N days
npm run collect backfill <days>
```

### Reports
```bash
# Generate and send weekly report
npm run report

# Generate without sending email (testing)
npm run report --no-email
```

### Development
```bash
# Start local development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Railway Deployment
```bash
# Login to Railway
railway login

# Initialize project
railway init

# Add PostgreSQL database
railway add

# View environment variables
railway variables

# Deploy to production
railway up

# View logs
railway logs

# Get production URL
railway domain
```

---

## 📊 Dashboard & API Endpoints

### Local Development
```
Dashboard:     http://localhost:3000
Health Check:  http://localhost:3000/health
API Dashboard: http://localhost:3000/api/dashboard
API Trends:    http://localhost:3000/api/trends?days=30
API Top Pages: http://localhost:3000/api/top-pages?days=7
API Queries:   http://localhost:3000/api/top-queries?days=7
```

### Production (After Deployment)
```
Dashboard:     https://berganco-seo.up.railway.app
(Replace with your actual Railway domain)
```

---

## 🔐 Environment Variables Needed

Copy to your `.env` file:

```env
# Database (from Railway)
DATABASE_URL="postgresql://..."

# Google Search Console (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"
GOOGLE_REFRESH_TOKEN="get-this-from-npm-run-setup"

# Website
SITE_URL="https://www.berganco.com"

# Email (from Resend)
RESEND_API_KEY="re_your_api_key"
REPORT_EMAIL_TO="client@berganco.com"
REPORT_EMAIL_FROM="seo@yourdomain.com"

# Server
PORT=3000
```

---

## 🆘 Troubleshooting Links

### Google Issues
**OAuth Consent Screen:**
```
https://console.cloud.google.com/apis/credentials/consent
```

**API Library:**
```
https://console.cloud.google.com/apis/library
```

### Database Issues
**Railway Logs:**
```bash
railway logs
```

**Check Database Connection:**
```bash
railway variables | grep DATABASE_URL
```

### Email Issues
**Resend Logs:**
```
https://resend.com/emails
```

**Verify Domain:**
```
https://resend.com/domains
```

---

## 📞 Support Resources

### External Documentation
- **Google Search Console API:** https://developers.google.com/webmaster-tools
- **Resend Docs:** https://resend.com/docs
- **Railway Docs:** https://docs.railway.app
- **Prisma Docs:** https://www.prisma.io/docs
- **Chart.js Docs:** https://www.chartjs.org/docs

### Testing Tools
- **PageSpeed Insights:** https://pagespeed.web.dev
- **Google Search Console:** https://search.google.com/search-console
- **Robots.txt Tester:** https://www.google.com/webmasters/tools/robots-testing-tool

---

## 🎯 Common Tasks Quick Reference

### First Time Setup
1. Open **NEXT_STEPS.md**
2. Follow steps 1-9
3. Total time: 15-20 minutes

### Daily Use
```bash
# Check dashboard
open http://localhost:3000

# Collect latest data
npm run collect

# View Railway logs
railway logs
```

### Client Communications
1. Open **CLIENT_EMAIL_TEMPLATE.md**
2. Choose appropriate template
3. Fill in data from latest report
4. Send to client

### Troubleshooting
1. Check Railway logs: `railway logs`
2. Check local console output
3. Verify .env variables are correct
4. Re-run setup if OAuth issues: `npm run setup`

---

## ✅ Setup Checklist URLs

Print this and check off as you complete:

- [ ] https://console.cloud.google.com/apis/library/searchconsole.googleapis.com (Enable API)
- [ ] https://console.cloud.google.com/apis/credentials (Create OAuth)
- [ ] https://resend.com/signup (Sign up for Resend)
- [ ] https://resend.com/api-keys (Get API key)
- [ ] `railway login` (Login to Railway)
- [ ] `railway init` (Initialize project)
- [ ] `railway add` (Add PostgreSQL)
- [ ] `npm run setup` (Get refresh token)
- [ ] `npm run migrate` (Setup database)
- [ ] `npm run collect backfill 30` (Get data)
- [ ] `npm run report` (Generate report)
- [ ] `railway up` (Deploy)

---

## 🚀 Launch Checklist

Before going live:

- [ ] All environment variables in Railway match local .env
- [ ] Database migrations run successfully
- [ ] 30 days of data collected
- [ ] First report generated and looks good
- [ ] Dashboard accessible and shows data
- [ ] Client email drafted
- [ ] Railway deployment successful
- [ ] Production URL accessible

---

## 📧 Client Dashboard URL

After deployment, share this with your client:

```
Your SEO Dashboard: https://[your-project].up.railway.app

Check anytime for:
• Real-time traffic metrics
• 30-day trend charts
• Top performing pages
• Search query rankings
• Weekly insights
```

---

**Bookmark this page for quick access to all links and commands! 🔖**

