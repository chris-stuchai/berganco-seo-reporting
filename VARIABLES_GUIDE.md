# 🔑 Variables Setup Guide - Quick Reference

All the URLs and places you need to go to get each variable.

---

## 📋 Variables You Need

| Variable | Where to Get It | Status |
|----------|----------------|--------|
| `DATABASE_URL` | Railway (after adding PostgreSQL) | ⏳ |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials | ⏳ |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials | ⏳ |
| `GOOGLE_REFRESH_TOKEN` | Run `npm run setup` | ⏳ |
| `GOOGLE_REDIRECT_URI` | Set manually (see below) | ✅ |
| `SITE_URL` | Already known: `https://www.berganco.com` | ✅ |
| `RESEND_API_KEY` | Resend Dashboard → API Keys | ⏳ |
| `REPORT_EMAIL_TO` | Client's email | ⏳ |
| `REPORT_EMAIL_FROM` | Your sending email | ⏳ |
| `PORT` | Default: `3000` | ✅ |

---

## 🔗 Direct Links for Each Variable

### 1. Google Cloud Console

**Create Project:**
```
https://console.cloud.google.com/
```

**Enable Search Console API:**
```
https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
```

**OAuth Consent Screen Setup:**
```
https://console.cloud.google.com/apis/credentials/consent
```

**Create OAuth Credentials:**
```
https://console.cloud.google.com/apis/credentials
```
→ Click "Create Credentials" → "OAuth client ID"
→ Type: Web application
→ Redirect URI: `http://localhost:3000/oauth2callback`
→ **COPY CLIENT ID AND SECRET**

**✅ Gets you:**
- `GOOGLE_CLIENT_ID` (long string ending in .apps.googleusercontent.com)
- `GOOGLE_CLIENT_SECRET` (shorter string)

---

### 2. Resend Email

**Sign Up:**
```
https://resend.com/signup
```

**Get API Key:**
```
https://resend.com/api-keys
```
→ Click "Create API Key"
→ Name: `BerganCo SEO Reports`
→ Permission: Sending access
→ **COPY API KEY** (starts with `re_`)

**Verify Domain (Optional):**
```
https://resend.com/domains
```

**✅ Gets you:**
- `RESEND_API_KEY` (starts with `re_`)

---

### 3. Google Refresh Token

**Run this command:**
```bash
cd "/Users/chris/BerganCo SEO Reporting"
npm run setup
```

Then:
1. Visit the URL it shows
2. Authorize the app
3. Copy code from redirect URL
4. Paste back in terminal
5. **COPY REFRESH TOKEN** it gives you

**✅ Gets you:**
- `GOOGLE_REFRESH_TOKEN` (long string starting with `1//`)

---

### 4. Railway Database

**Login/Create Account:**
```
https://railway.app
```

**Create Project:**
→ New Project → Deploy from GitHub repo
→ Select: `chris-stuchai/berganco-seo-reporting`

**Add PostgreSQL:**
→ In project: "+ New" → Database → Add PostgreSQL

**Get DATABASE_URL:**
→ Click PostgreSQL service → Variables tab
→ Find `DATABASE_URL` → Click eye icon 👁️
→ **COPY THE ENTIRE VALUE**

**✅ Gets you:**
- `DATABASE_URL` (postgresql://...)

---

## 📝 Quick Copy-Paste Template

Once you have all values, paste them into your `.env` file:

```env
# Database (from Railway)
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"

# Google OAuth2 (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"
GOOGLE_REFRESH_TOKEN="1//0gxxxxxxxxxxxxx..."

# Website
SITE_URL="https://www.berganco.com"

# Resend (from Resend dashboard)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Email Configuration
REPORT_EMAIL_TO="client@berganco.com"
REPORT_EMAIL_FROM="seo@yourdomain.com"

# Server
PORT=3000
```

**For Railway**, add all the same variables in the Railway dashboard:
- Go to your service → Variables tab
- Click "+ New Variable" for each one

---

## 🎯 Step-by-Step Order

1. **Google Cloud Console** (10 min)
   - Create project
   - Enable Search Console API
   - Setup OAuth consent screen
   - Create OAuth credentials
   - **✅ Get:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

2. **Resend** (5 min)
   - Sign up
   - Create API key
   - **✅ Get:** `RESEND_API_KEY`

3. **Local .env** (2 min)
   - Fill in what you have so far
   - Set `GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"`
   - Set `SITE_URL="https://www.berganco.com"`
   - Set `PORT=3000`

4. **Get Refresh Token** (3 min)
   - Run `npm run setup`
   - Follow prompts
   - **✅ Get:** `GOOGLE_REFRESH_TOKEN`

5. **Railway** (5 min)
   - Create project from GitHub
   - Add PostgreSQL database
   - **✅ Get:** `DATABASE_URL`

6. **Railway Variables** (3 min)
   - Add all variables to Railway
   - Update `GOOGLE_REDIRECT_URI` with production URL

7. **Done!** ✅
   - Run migrations
   - Collect data
   - Generate report

---

## ⚡ Super Quick Start

If you want the absolute fastest path:

1. **Google:** https://console.cloud.google.com/apis/credentials → Create OAuth client
2. **Resend:** https://resend.com/api-keys → Create API key
3. **Run:** `npm run setup` → Get refresh token
4. **Railway:** https://railway.app → Create project → Add PostgreSQL
5. **Add all to:** `.env` file and Railway variables

**Total time: ~20 minutes**

---

## 🆘 Common Issues

### "Where do I find the Client Secret?"
- In Google Cloud Console → Credentials
- Click on your OAuth Client ID
- If you see "***", it means you already closed it
- You'll need to create a new one (old one won't work without secret)

### "Refresh token not working"
- Make sure you're using the correct Gmail account (the one you added as test user)
- Re-run `npm run setup`

### "Can't see DATABASE_URL in Railway"
- Make sure you clicked on the PostgreSQL service (🐘 icon), not your app service
- Go to Variables tab
- Click the eye icon to reveal

### "Which redirect URI for production?"
- After Railway gives you URL (e.g., `berganco-seo.up.railway.app`)
- Use: `https://berganco-seo.up.railway.app/oauth2callback`
- Add this to Google Cloud Console → Credentials → Your OAuth client
- Also update in Railway variables

---

## 📚 Full Details

For complete step-by-step instructions with screenshots guidance, see:
**`SETUP_WALKTHROUGH.md`**

---

**Bookmark this page for quick access to all the links! 🔖**

