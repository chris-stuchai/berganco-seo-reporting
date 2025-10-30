# 📧 Setting Up Gmail/Google Workspace Email

This guide shows you how to use your Google domain email (like `support@stuchai.com`) to send the SEO reports instead of Resend.

---

## ✅ Benefits of Using Your Gmail/Google Workspace

- ✅ **No additional service** - Use your existing email
- ✅ **Professional from address** - Sends from your domain (`support@stuchai.com`)
- ✅ **No monthly limits** - Gmail/Workspace has generous sending limits
- ✅ **Already set up** - If you have Google Workspace, it's ready to use
- ✅ **Free** - No extra cost beyond your existing email service

---

## 🔑 Step 1: Enable 2-Factor Authentication

**You MUST have 2FA enabled** to use App Passwords (Google's security requirement).

### For Personal Gmail:

1. **Go to Google Account:**
   ```
   https://myaccount.google.com/security
   ```

2. **Enable 2-Step Verification:**
   - Click "2-Step Verification"
   - Follow the setup process (use phone or authenticator app)
   - Complete verification

### For Google Workspace (Business Email):

1. **Go to Admin Console:**
   ```
   https://admin.google.com
   ```

2. **Enable 2-Step Verification:**
   - Go to: Security → 2-Step Verification
   - Enable for your account
   - Or ask your admin to enable it

---

## 🔐 Step 2: Create App Password

**App Passwords are special passwords for apps** - you can't use your regular password.

### For Personal Gmail:

1. **Go to App Passwords:**
   ```
   https://myaccount.google.com/apppasswords
   ```
   
   (If the link doesn't work directly, go to: Google Account → Security → App Passwords)

2. **Create App Password:**
   - **Select app:** Choose "Mail" or "Other (Custom name)"
   - **Select device:** Choose "Other (Custom name)"
   - **Name:** Type "BerganCo SEO Reports" (or any name)
   - Click **"Generate"**

3. **Copy the App Password:**
   - Google will show you a 16-character password like: `abcd efgh ijkl mnop`
   - **Copy this entire password** (with or without spaces, both work)
   - **⚠️ Save it NOW - you won't see it again!**

### For Google Workspace (Business Email):

**Option A: If you're the admin:**

1. **Go to Admin Console:**
   ```
   https://admin.google.com
   ```

2. **Enable App Passwords for your organization:**
   - Go to: Security → Access and data control → API controls
   - Under "Less secure app access" (if shown), allow it
   - Or enable "App Passwords" specifically

3. **Create App Password for your account:**
   - Go to: https://myaccount.google.com/apppasswords
   - Follow same steps as personal Gmail above

**Option B: If you're not the admin:**

Ask your Google Workspace admin to:
- Enable 2-Step Verification for your account
- Enable App Passwords for the organization
- Or provide you with an App Password

---

## ⚙️ Step 3: Configure Your .env File

Open your `.env` file and add these variables:

```env
# Gmail/Google Workspace SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="support@stuchai.com"  # Your Google Workspace email
SMTP_PASSWORD="abcd efgh ijkl mnop"  # The App Password you just created
REPORT_EMAIL_FROM="support@stuchai.com"  # Can be different from SMTP_USER
REPORT_EMAIL_TO="client@berganco.com"  # Where to send reports
```

**Important Notes:**
- `SMTP_USER` = The email address you use to log in
- `SMTP_PASSWORD` = The App Password (NOT your regular password!)
- `REPORT_EMAIL_FROM` = Can be any email on your domain (for display purposes)
- For Google Workspace, use your full email address (e.g., `support@stuchai.com`)

---

## ✅ Step 4: Test Your Email Setup

### Test Locally:

```bash
cd "/Users/chris/BerganCo SEO Reporting"
npm run dev
```

Then in another terminal:

```bash
npm run report --no-email  # Generate report without sending
# Or manually test with a script
```

### Create a Test Script:

Create `test-email.ts`:

```typescript
import * as dotenv from 'dotenv';
import { sendWeeklyReport } from './src/services/email-service';
import { startOfWeek, subWeeks } from 'date-fns';

dotenv.config();

async function test() {
  const testData = {
    weekStartDate: startOfWeek(subWeeks(new Date(), 1)),
    weekEndDate: new Date(),
    currentMetrics: {
      totalClicks: 1000,
      totalImpressions: 50000,
      averageCtr: 0.02,
      averagePosition: 5.5,
    },
    previousMetrics: {
      totalClicks: 1200,
      totalImpressions: 55000,
      averageCtr: 0.022,
      averagePosition: 5.2,
    },
    clicksChange: -16.7,
    impressionsChange: -9.1,
    ctrChange: -9.1,
    positionChange: 0.3,
    topPages: [],
    topQueries: [],
    insights: 'Test email - this is a test',
    recommendations: 'Test email - this is a test',
  };

  try {
    await sendWeeklyReport(testData);
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
```

Run: `tsx test-email.ts`

---

## 🚨 Troubleshooting

### "Invalid login" Error

**Problem:** Wrong password or 2FA not enabled

**Solution:**
1. Make sure 2-Step Verification is enabled
2. Make sure you're using an **App Password**, not your regular password
3. Copy the App Password exactly (spaces don't matter, but all characters must match)
4. Regenerate the App Password if needed

### "Less secure app access" Error

**Problem:** Google blocking access

**Solution:**
- For personal Gmail: Use App Password (which you already are)
- For Google Workspace: Admin needs to enable "Less secure app access" or allow App Passwords

### "Connection timeout" Error

**Problem:** Can't connect to SMTP server

**Solution:**
- Check your internet connection
- Make sure `SMTP_HOST` is `smtp.gmail.com`
- Make sure `SMTP_PORT` is `587`
- Check if your firewall is blocking port 587

### Email Sends but Goes to Spam

**Problem:** SPF/DKIM not configured

**Solution:**
- For Google Workspace: Usually already configured
- Make sure your domain's SPF record includes Google's servers
- Consider setting up DMARC

### "User not found" Error

**Problem:** Wrong email address

**Solution:**
- Make sure `SMTP_USER` is the full email address (e.g., `support@stuchai.com`)
- Make sure the email exists in your Google Workspace
- Make sure you have permission to send from that address

---

## 📋 Configuration Checklist

Use this to verify your setup:

- [ ] 2-Step Verification enabled on your Google account
- [ ] App Password created and copied
- [ ] `SMTP_HOST` set to `smtp.gmail.com`
- [ ] `SMTP_PORT` set to `587`
- [ ] `SMTP_USER` set to your full email (e.g., `support@stuchai.com`)
- [ ] `SMTP_PASSWORD` set to your App Password (NOT regular password)
- [ ] `REPORT_EMAIL_FROM` set to your sending email
- [ ] `REPORT_EMAIL_TO` set to client's email
- [ ] Test email sent successfully
- [ ] Email received in inbox (not spam)

---

## 🔄 For Railway Deployment

Add these same variables to Railway:

1. Go to your Railway project
2. Click your service → Variables tab
3. Add all the SMTP variables:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=support@stuchai.com`
   - `SMTP_PASSWORD=your-app-password`
   - `REPORT_EMAIL_FROM=support@stuchai.com`
   - `REPORT_EMAIL_TO=client@berganco.com`

**Important:** Railway will mask the password for security, which is good!

---

## 💡 Tips

1. **App Passwords are per-device**: If you deploy to Railway, you can use the same App Password
2. **App Passwords can be revoked**: If you suspect it's compromised, delete it and create a new one
3. **Test first**: Always test locally before deploying to production
4. **Check spam**: First few emails might go to spam until your sender reputation builds
5. **Rate limits**: Gmail allows 500 emails/day for free accounts, 2000/day for Workspace

---

## 🆚 Gmail vs Resend Comparison

| Feature | Gmail/Workspace | Resend |
|---------|---------------|--------|
| **Cost** | Free (with your email) | Free tier: 50k/month |
| **From Address** | Your domain email | Verified domain |
| **Setup** | App Password needed | API key needed |
| **Limits** | 500/day (free), 2000/day (Workspace) | 50k/month free |
| **Domain Verification** | Not needed | Required for custom domain |

**For your use case (weekly reports to one client):**
- ✅ Gmail/Google Workspace is perfect - no limits you'll hit
- ✅ Professional from address (`support@stuchai.com`)
- ✅ No additional service needed
- ✅ Already part of your infrastructure

---

## ✅ You're Done!

Your emails will now send from `support@stuchai.com` using your existing Google Workspace account. No need for Resend!

The system will automatically:
- Send weekly reports every Monday at 8 AM
- Use your configured email address
- Include professional HTML formatting
- Handle errors gracefully

---

**Need help?** Check Railway logs if deployed, or test locally first!

