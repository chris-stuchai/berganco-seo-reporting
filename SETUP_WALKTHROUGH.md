# 🎯 Complete Setup Walkthrough - Getting All Your Variables

This guide will walk you through **exactly** where to find and how to get every single variable you need for the BerganCo SEO Reporting system.

---

## 📋 Variables Checklist

You'll need these variables. Check them off as you collect them:

```env
✅ DATABASE_URL              (from Railway - after creating PostgreSQL)
⏳ GOOGLE_CLIENT_ID          (from Google Cloud Console)
⏳ GOOGLE_CLIENT_SECRET      (from Google Cloud Console)
⏳ GOOGLE_REFRESH_TOKEN      (from running npm run setup)
⏳ GOOGLE_REDIRECT_URI       (set to: http://localhost:3000/oauth2callback)
⏳ SITE_URL                  (https://www.berganco.com)
⏳ RESEND_API_KEY            (from Resend dashboard)
⏳ REPORT_EMAIL_TO           (your client's email)
⏳ REPORT_EMAIL_FROM         (your sending email)
⏳ PORT                      (3000 - default)
```

---

## Step 1: Google Search Console API Setup (10 minutes)

### A. Create or Select a Google Cloud Project

1. **Go to Google Cloud Console:**
   ```
   https://console.cloud.google.com/
   ```

2. **Create a new project OR select existing:**
   - Click the project dropdown at the top
   - Click "New Project"
   - Project name: `BerganCo SEO Monitor`
   - Click "Create"
   - Wait for it to be created, then select it

### B. Enable Google Search Console API

1. **Go to API Library:**
   ```
   https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
   ```

2. **Enable the API:**
   - Make sure your project is selected at the top
   - Click the big blue **"Enable"** button
   - Wait for it to enable (5-10 seconds)
   - You should see "API enabled" confirmation

### C. Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen:**
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **Configure the consent screen:**
   - **User Type:** Select **"External"** (unless you have a Google Workspace)
   - Click **"Create"**
   
3. **App Information:**
   - **App name:** `BerganCo SEO Reporter`
   - **User support email:** Your email address
   - **App logo:** (Optional - can skip)
   - **App domain:** (Can skip for now)
   - **Developer contact:** Your email address
   - Click **"Save and Continue"**

4. **Scopes:**
   - Click **"Add or Remove Scopes"**
   - Scroll down and check: `.../auth/webmasters.readonly`
   - Click **"Update"**
   - Click **"Save and Continue"**

5. **Test Users:**
   - Click **"Add Users"**
   - Add your Gmail address (the one you'll use to authorize)
   - Click **"Add"**
   - Click **"Save and Continue"**

6. **Summary:**
   - Review everything looks correct
   - Click **"Back to Dashboard"**

### D. Create OAuth 2.0 Credentials

1. **Go to Credentials:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Create OAuth Client ID:**
   - Click **"+ Create Credentials"** at the top
   - Select **"OAuth client ID"**
   - If prompted about consent screen, select **"External"** and continue

3. **Configure OAuth Client:**
   - **Application type:** Select **"Web application"**
   - **Name:** `BerganCo SEO Reporter`
   
4. **Authorized redirect URIs:**
   - Click **"+ Add URI"**
   - Add: `http://localhost:3000/oauth2callback`
   - **Important:** For Railway deployment, you'll also need to add your Railway URL later:
     - `https://[your-railway-app].up.railway.app/oauth2callback`
   - But for now, just add localhost

5. **Click "Create"**

6. **Save Your Credentials:**
   A popup will appear with your credentials:
   
   ```
   Your Client ID
   [A long string ending in .apps.googleusercontent.com]
   👆 COPY THIS
   
   Your Client Secret
   [A shorter string]
   👆 COPY THIS
   ```

   **⚠️ IMPORTANT:** Copy both of these NOW - you won't be able to see the secret again!
   
   Save them somewhere safe, we'll add them to `.env` next.

**✅ You now have:**
- ✅ `GOOGLE_CLIENT_ID` (the long one ending in .apps.googleusercontent.com)
- ✅ `GOOGLE_CLIENT_SECRET` (the shorter one)

---

## Step 2: Resend Email Setup (5 minutes)

### A. Sign Up for Resend

1. **Go to Resend signup:**
   ```
   https://resend.com/signup
   ```

2. **Create account:**
   - Enter your email
   - Create a password
   - Click "Create account"
   - Verify your email (check your inbox)

### B. Get Your API Key

1. **Go to API Keys:**
   ```
   https://resend.com/api-keys
   ```

2. **Create API Key:**
   - Click **"Create API Key"** button
   - **Name:** `BerganCo SEO Reports`
   - **Permission:** Select **"Sending access"** (you can restrict it)
   - Click **"Add"**

3. **Copy Your API Key:**
   A modal will show your API key:
   ```
   re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   
   **⚠️ IMPORTANT:** Copy this NOW - you won't be able to see it again!
   
   If you lose it, you'll need to create a new one.

**✅ You now have:**
- ✅ `RESEND_API_KEY` (starts with `re_`)

### C. (Optional) Verify Sending Domain

For production emails, you should verify your domain. For testing, you can skip this.

**Option 1: Use Resend Test Domain (Easiest for Testing)**
- You can use: `onboarding@resend.dev` as your sender
- No verification needed
- Good for testing only

**Option 2: Verify Your Domain (For Production)**
1. Go to: https://resend.com/domains
2. Click **"Add Domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records they provide to your domain's DNS
5. Wait for verification (usually instant, max 24 hours)

---

## Step 3: Configure Your Local .env File (2 minutes)

Now let's add all the variables you've collected to your `.env` file.

### A. Open Your .env File

```bash
cd "/Users/chris/BerganCo SEO Reporting"
nano .env
# OR use your favorite editor (VS Code, etc.)
```

### B. Fill In Your Variables

Replace the values with what you collected:

```env
# Database - We'll get this from Railway next
DATABASE_URL="postgresql://username:password@localhost:5432/berganco_seo"

# Google OAuth2 Credentials (from Step 1)
GOOGLE_CLIENT_ID="paste-your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="paste-your-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"

# Google Refresh Token (we'll get this in Step 4)
GOOGLE_REFRESH_TOKEN=""

# Website to monitor
SITE_URL="https://www.berganco.com"

# Resend Email (from Step 2)
RESEND_API_KEY="re_paste-your-resend-api-key-here"

# Email Configuration
REPORT_EMAIL_TO="your-client@berganco.com"
REPORT_EMAIL_FROM="seo@yourdomain.com"
# OR for testing: REPORT_EMAIL_FROM="onboarding@resend.dev"

# Server
PORT=3000
```

### C. Save and Close

Save the file (Ctrl+O, Enter, Ctrl+X in nano, or Save in your editor)

**✅ You now have:**
- ✅ Most variables configured in `.env`
- ⏳ Still need: `GOOGLE_REFRESH_TOKEN` (next step)
- ⏳ Still need: `DATABASE_URL` (from Railway)

---

## Step 4: Get Google Refresh Token (3 minutes)

The refresh token is needed for the app to automatically authenticate with Google Search Console API.

### A. Run the Setup Script

```bash
cd "/Users/chris/BerganCo SEO Reporting"
npm run setup
```

### B. Follow the Prompts

1. **You'll see a URL like this:**
   ```
   Step 1: Visit this URL to authorize the application:
   
   https://accounts.google.com/o/oauth2/v2/auth?...
   ```

2. **Copy and open this URL in your browser**

3. **Authorize the App:**
   - You'll see "BerganCo SEO Reporter wants to access your Google Account"
   - Make sure you're signed in with the Gmail account you added as a test user
   - Click **"Continue"** or **"Allow"**
   - You might see a warning about "unverified app" - click **"Advanced"** then **"Go to BerganCo SEO Reporter (unsafe)"**

4. **Get the Authorization Code:**
   - After authorizing, Google will redirect you to `http://localhost:3000/oauth2callback?code=...`
   - **Your browser might say "can't connect"** - that's OK!
   - **Look at the URL bar** - you'll see something like:
     ```
     http://localhost:3000/oauth2callback?code=4/0AeanRr...
     ```
   - **Copy the entire code value** (everything after `code=`)

5. **Paste the Code:**
   - Go back to your terminal
   - The script is waiting for: `Step 2: Enter the authorization code from the redirect URL:`
   - Paste the code you copied
   - Press Enter

6. **Get Your Refresh Token:**
   - The script will exchange the code for tokens
   - You'll see:
     ```
     ✅ Success! Add this to your .env file:
     
     GOOGLE_REFRESH_TOKEN="1//0gxxxxxxxxxxxxx..."
     ```

7. **Add to .env:**
   - Open your `.env` file again
   - Find the line: `GOOGLE_REFRESH_TOKEN=""`
   - Replace the empty string with the token (including the quotes):
     ```env
     GOOGLE_REFRESH_TOKEN="1//0gxxxxxxxxxxxxx..."
     ```
   - Save the file

**✅ You now have:**
- ✅ `GOOGLE_REFRESH_TOKEN` configured

**⚠️ Troubleshooting:**
- **"Invalid redirect URI"**: Make sure you added `http://localhost:3000/oauth2callback` in Google Cloud Console
- **"Access blocked"**: Make sure your Gmail is in the test users list
- **Can't see redirect URL**: Check your browser's address bar, even if page shows error

---

## Step 5: Railway PostgreSQL Setup (5 minutes)

### A. Create Railway Account / Login

1. **Go to Railway:**
   ```
   https://railway.app
   ```

2. **Sign up or Login:**
   - Click "Login" or "Start a New Project"
   - Authorize with GitHub (easiest)
   - Complete setup

### B. Create New Project from GitHub

1. **Create New Project:**
   - Click **"New Project"** button
   - Select **"Deploy from GitHub repo"**
   - Authorize Railway to access GitHub (if first time)
   - Find and select: **`chris-stuchai/berganco-seo-reporting`**
   - Railway will automatically start deploying

### C. Add PostgreSQL Database

1. **Add Database:**
   - In your Railway project, click **"+ New"**
   - Select **"Database"**
   - Choose **"Add PostgreSQL"**
   - Railway will create the database (takes ~30 seconds)

2. **Get Database URL:**
   - Click on the **PostgreSQL service** (it has a 🐘 icon)
   - Go to the **"Variables"** tab
   - You'll see a variable called **`DATABASE_URL`**
   - Click the **eye icon** 👁️ to reveal it
   - It will look like:
     ```
     postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
     ```
   - **Copy this entire value**

### D. Add DATABASE_URL to Railway Environment Variables

1. **Go to Your App Service:**
   - Click on your main service (not the PostgreSQL one)
   - Go to **"Variables"** tab

2. **Add All Environment Variables:**
   Click **"+ New Variable"** and add each one:

   ```env
   DATABASE_URL=postgresql://... (paste the one you copied)
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REFRESH_TOKEN=your-refresh-token
   GOOGLE_REDIRECT_URI=https://your-app.up.railway.app/oauth2callback
   SITE_URL=https://www.berganco.com
   RESEND_API_KEY=re_your-api-key
   REPORT_EMAIL_TO=client@berganco.com
   REPORT_EMAIL_FROM=seo@yourdomain.com
   PORT=3000
   ```

   **⚠️ Important Notes:**
   - For `GOOGLE_REDIRECT_URI`, you'll need to update it once you know your Railway URL
   - Add them one by one (click "+ New Variable" for each)
   - Make sure to match the exact variable names (case-sensitive)

**✅ You now have:**
- ✅ Railway project created
- ✅ PostgreSQL database added
- ✅ `DATABASE_URL` from Railway
- ✅ All environment variables in Railway

---

## Step 6: Update Google Redirect URI for Production (2 minutes)

Once Railway gives you your production URL, you need to add it to Google Cloud Console.

### A. Get Your Railway URL

1. **In Railway:**
   - Go to your app service
   - Click **"Settings"**
   - Scroll to **"Domains"**
   - Click **"Generate Domain"** (or use a custom domain)
   - Copy your URL (e.g., `berganco-seo.up.railway.app`)

### B. Add to Google Cloud Console

1. **Go back to Credentials:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Edit Your OAuth Client:**
   - Find your OAuth 2.0 Client ID
   - Click the **pencil icon** ✏️ to edit

3. **Add Production Redirect URI:**
   - Under "Authorized redirect URIs", click **"+ Add URI"**
   - Add: `https://berganco-seo.up.railway.app/oauth2callback`
   (Replace with your actual Railway URL)
   - Click **"Save"**

4. **Update Railway Variable:**
   - Go back to Railway → Your service → Variables
   - Edit `GOOGLE_REDIRECT_URI`
   - Change to: `https://your-railway-url.up.railway.app/oauth2callback`
   - Save

**✅ You now have:**
- ✅ Production redirect URI configured
- ✅ Ready for Railway deployment

---

## Step 7: Run Database Migrations (1 minute)

Once Railway is deployed, run migrations to create the database tables.

### A. Via Railway Dashboard

1. **Open Railway Service:**
   - Click on your app service
   - Go to **"Deployments"** tab
   - Wait for deployment to finish (green checkmark)

2. **Run Migrations:**
   - Click the **three dots** menu (⋯)
   - Select **"Open in shell"** or **"Open Logs"**
   - Or use Railway CLI (see below)

### B. Via Railway CLI (Recommended)

```bash
# Make sure you're logged in
railway login

# Link to your project (if not already linked)
railway link
# Select your project when prompted

# Run migrations
railway run npm run migrate
```

**✅ You now have:**
- ✅ Database tables created
- ✅ Ready to collect data

---

## Step 8: Collect Historical Data (3-5 minutes)

Now let's pull 30 days of historical data to see when the traffic drop occurred.

### Via Railway CLI:

```bash
# Make sure you're linked to your Railway project
railway link

# Collect last 30 days of data
railway run npm run collect backfill 30
```

This will:
- Pull data from Google Search Console
- Show you exactly when the 50% drop occurred
- Identify affected pages and keywords
- Store everything in your database

**Note:** This might take 3-5 minutes as it pulls a lot of data.

**✅ You now have:**
- ✅ 30 days of historical data
- ✅ Insights into the traffic drop

---

## Step 9: Generate First Report (30 seconds)

```bash
# Generate and send weekly report
railway run npm run report
```

Or test locally first:

```bash
# Test locally
npm run report
```

**Check your email!** You should receive the first weekly report showing:
- Current metrics
- The 50% traffic drop
- Affected pages
- Actionable recommendations

**✅ You now have:**
- ✅ First report generated
- ✅ Ready to send to client

---

## Step 10: View Dashboard

### Local Development:
```bash
npm run dev
```
Then open: http://localhost:3000

### Production (Railway):
Your Railway URL (e.g., `https://berganco-seo.up.railway.app`)

**You'll see:**
- Real-time metrics
- 30-day trend charts
- Top pages and queries
- Latest insights

---

## ✅ Complete Setup Checklist

Use this to track your progress:

- [ ] Google Cloud project created
- [ ] Search Console API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth credentials created
- [ ] `GOOGLE_CLIENT_ID` copied
- [ ] `GOOGLE_CLIENT_SECRET` copied
- [ ] Resend account created
- [ ] `RESEND_API_KEY` copied
- [ ] `.env` file configured (local)
- [ ] `GOOGLE_REFRESH_TOKEN` obtained (via npm run setup)
- [ ] Railway account created
- [ ] Railway project created from GitHub
- [ ] PostgreSQL database added to Railway
- [ ] `DATABASE_URL` copied from Railway
- [ ] All variables added to Railway
- [ ] Production redirect URI added to Google
- [ ] Database migrations run
- [ ] Historical data collected (30 days)
- [ ] First report generated
- [ ] Dashboard accessible

---

## 🆘 Troubleshooting

### "Invalid grant" or "Refresh token expired"
- Re-run: `npm run setup`
- Make sure you're using the correct Gmail account
- Check that your test user email matches

### "No data available"
- Google Search Console has a 2-3 day delay
- Try: `npm run collect backfill 7` (only last 7 days)

### Email not sending
- Verify `RESEND_API_KEY` is correct
- Check sender email domain is verified (or use `onboarding@resend.dev`)
- Check Railway logs: `railway logs`

### Database connection errors
- Verify `DATABASE_URL` in Railway variables
- Make sure PostgreSQL service is running
- Check Railway logs for connection errors

### Can't get refresh token
- Make sure redirect URI is exactly: `http://localhost:3000/oauth2callback`
- Use the Gmail account you added as test user
- Check browser console for errors
- Try incognito/private window

---

## 🎉 You're Done!

Once you've completed all steps:

1. ✅ System is collecting data daily
2. ✅ Weekly reports send automatically every Monday
3. ✅ Client can access dashboard 24/7
4. ✅ You have insights into the 50% traffic drop
5. ✅ Ready to implement recovery strategies

**Next:** Send the client update email using templates in `CLIENT_EMAIL_TEMPLATE.md`

---

## 📞 Need Help?

- **Google Cloud Issues:** Check API status in Google Cloud Console
- **Railway Issues:** Check logs with `railway logs`
- **Email Issues:** Check Resend dashboard → Emails
- **Data Issues:** Check Railway logs for collection errors

**You've got this! The system is designed to be automated once setup is complete.** 🚀

