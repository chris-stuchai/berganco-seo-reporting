# ⚡ Get Started in 10 Minutes

Your client's traffic dropped 50%. Here's how to get insights **RIGHT NOW**:

---

## Step 1: Google Search Console API (3 minutes)

### Enable API:
1. Visit: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
2. Click **Enable**

### Get Credentials:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Redirect URI: `http://localhost:3000/oauth2callback`
5. **Copy Client ID and Secret**

---

## Step 2: Resend Email (2 minutes)

1. Sign up: https://resend.com/signup
2. Get API key: https://resend.com/api-keys
3. **Copy the API key** (starts with `re_`)

---

## Step 3: Configure (2 minutes)

```bash
cd "/Users/chris/BerganCo SEO Reporting"
cp .env.example .env
nano .env  # or use your favorite editor
```

Fill in:
```env
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-secret"
RESEND_API_KEY="re_your_key"
REPORT_EMAIL_TO="client@berganco.com"
REPORT_EMAIL_FROM="seo@yourdomain.com"
```

---

## Step 4: Get Refresh Token (1 minute)

```bash
npm run setup
```

- Visit the URL it shows
- Authorize
- Copy the code from redirect URL
- Paste it back
- Add the refresh token to `.env`

---

## Step 5: Setup Database (2 minutes)

### Railway (Recommended):
```bash
railway login
railway init
railway add  # Select PostgreSQL
railway variables  # Copy DATABASE_URL to .env
npm run migrate
```

### OR Local (For Testing):
```bash
createdb berganco_seo
# Add to .env: DATABASE_URL="postgresql://localhost:5432/berganco_seo"
npm run migrate
```

---

## Step 6: Get the Data! (3 minutes)

```bash
# Collect last 30 days
npm run collect backfill 30

# Generate first report
npm run report

# Start dashboard
npm run dev
```

Open: **http://localhost:3000**

---

## ✅ What You'll See

### In the Email Report:
- **Exact traffic drop %** (likely ~50%)
- **When it started** (specific date)
- **Affected pages** (which pages lost traffic)
- **Lost keywords** (which searches dropped)
- **Action items** (what to fix)

### On the Dashboard:
- 📊 Real-time metrics
- 📈 30-day trend charts (visualizing the drop)
- 🏆 Top pages
- 🔎 Top queries
- 💡 Insights and recommendations

---

## 🚀 Deploy to Production (Optional)

```bash
railway up
railway domain
```

Share the URL with your client!

---

## 🎯 Next: Send to Client

After you have the first report:

```
Subject: BerganCo Traffic Drop - Analysis Complete

Hi [Client],

I've analyzed the 50% traffic drop and deployed a monitoring system:

📊 Findings:
• Drop started: [date from report]
• Affected pages: [from report]
• Keywords impacted: [from report]
• Likely cause: [from insights]

✅ Actions:
• Monitoring system deployed
• Weekly reports starting Monday
• Dashboard: [your Railway URL]
• Implementing fixes from analysis

You'll receive weekly progress updates.

[Your Name]
```

---

## 📞 Common Issues

**"Invalid grant"**: Refresh token expired, run `npm run setup` again

**"No data"**: GSC has 2-3 day delay, try `npm run collect backfill 7`

**Email failed**: Check RESEND_API_KEY, or use `onboarding@resend.dev` for testing

---

**That's it! You now have professional SEO monitoring showing your client you're on top of the traffic drop.** 🎉

For detailed docs, see: `SETUP_GUIDE.md`

