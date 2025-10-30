# 🚂 Railway vs Local .env - How They Work Together

**Important:** Railway and local `.env` files are **separate** but you need both!

---

## 📁 Local .env File (For Development/Testing)

**Purpose:** Used when running the app locally (`npm run dev`, `npm run collect`, etc.)

**Location:** `/Users/chris/BerganCo SEO Reporting/.env`

**When you need it:**
- ✅ Testing locally before deploying
- ✅ Running `npm run setup` to get refresh token
- ✅ Collecting data from your computer
- ✅ Generating test reports
- ✅ Development and debugging

---

## 🚂 Railway Environment Variables (For Production)

**Purpose:** Used when the app runs on Railway servers

**Location:** Railway Dashboard → Your Service → Variables tab

**When you need it:**
- ✅ When app is deployed to Railway
- ✅ Scheduled jobs (daily collection, weekly reports)
- ✅ Production deployments
- ✅ Client accessing the dashboard

---

## 🔄 How They Work Together

### Scenario 1: Getting Refresh Token Locally

1. **Fill local `.env`** with:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`

2. **Run locally:**
   ```bash
   npm run setup
   ```
   This uses your local `.env` file

3. **Get refresh token** → Add to local `.env`

4. **Copy to Railway:** After you have the refresh token, add it to Railway variables too

### Scenario 2: Deploying to Railway

1. **Local .env:** Fill it out (for local testing)

2. **Railway Variables:** Add the SAME variables in Railway dashboard

3. **Deploy:**
   ```bash
   railway up
   ```
   Railway uses its own variables (not your local `.env`)

---

## 📋 Variables Checklist

You need to set these in **BOTH** places:

### Local .env File
```
✅ GOOGLE_CLIENT_ID
✅ GOOGLE_CLIENT_SECRET  
✅ GOOGLE_REFRESH_TOKEN (get via npm run setup)
✅ GOOGLE_REDIRECT_URI (localhost for local)
✅ SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
✅ REPORT_EMAIL_FROM, REPORT_EMAIL_TO
✅ DATABASE_URL (local OR Railway URL)
✅ SITE_URL
✅ PORT
```

### Railway Variables
```
✅ Same variables as above EXCEPT:
   - GOOGLE_REDIRECT_URI (use Railway URL: https://your-app.up.railway.app/oauth2callback)
   - DATABASE_URL (Railway auto-creates this when you add PostgreSQL)
```

---

## 🚀 Recommended Workflow

### Step 1: Fill Local .env
```bash
# I just created .env template for you
# Open it and fill in all values
nano .env  # or use your editor
```

### Step 2: Get Refresh Token Locally
```bash
npm run setup
# Follow prompts
# Add refresh token to local .env
```

### Step 3: Test Locally
```bash
npm run dev
npm run collect backfill 7  # Test with 7 days
npm run report  # Test report generation
```

### Step 4: Add Variables to Railway
1. Go to Railway dashboard
2. Your service → Variables tab
3. Add all the same variables (copy from local .env)
4. **Exception:** Update `GOOGLE_REDIRECT_URI` to Railway URL

### Step 5: Deploy
```bash
railway up
```

---

## 💡 Pro Tips

### Option A: Copy from Local to Railway

After you fill `.env`, you can manually copy each variable to Railway:
1. Open `.env` in editor
2. Open Railway → Variables
3. Copy-paste each one

### Option B: Use Railway CLI

You can set Railway variables from command line:

```bash
# Set one variable
railway variables set GOOGLE_CLIENT_ID="your-value"

# Or set multiple
railway variables set \
  GOOGLE_CLIENT_ID="value" \
  GOOGLE_CLIENT_SECRET="value" \
  SMTP_USER="support@stuchai.com"
```

### Option C: Pull Railway Variables (Read-Only)

Railway variables are more secure (masked). For production, it's better to set them in Railway.

---

## 🎯 Key Differences

| Feature | Local .env | Railway Variables |
|---------|------------|------------------|
| **Used for** | Local development | Production deployment |
| **Required for** | `npm run setup` | Railway deployments |
| **Can see values** | Yes (in file) | Yes (in dashboard, but passwords masked) |
| **Security** | File on your computer | Stored by Railway |
| **Refresh Token** | Get it locally first | Copy from local after getting it |
| **Redirect URI** | `http://localhost:3000/oauth2callback` | `https://your-app.up.railway.app/oauth2callback` |

---

## ✅ What to Do Now

1. **Fill the local `.env` file** I just created
2. **Get refresh token** locally: `npm run setup`
3. **Test locally** to make sure everything works
4. **Copy variables to Railway** (manually or via CLI)
5. **Update Railway's `GOOGLE_REDIRECT_URI`** to Railway URL
6. **Deploy to Railway**

---

## 🆘 What if I only fill Railway?

You **can't get the refresh token** without local `.env` because:
- `npm run setup` needs local `.env` to work
- It's an interactive process that runs locally
- Once you have the token, copy it to Railway

**Solution:** Always get refresh token locally first, then copy to Railway.

---

## 📝 Summary

- ✅ **Local .env** = For development and getting refresh token
- ✅ **Railway Variables** = For production deployment
- ✅ **Both needed** = Fill local first, then copy to Railway
- ✅ **Refresh token** = Get locally via `npm run setup`, then add to both places

---

**Your `.env` template is ready! Fill it in and let me know when you're ready for the next step!** 🚀

