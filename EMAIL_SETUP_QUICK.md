# 📧 Quick Email Setup - Using support@stuchai.com

**Yes! You can absolutely use your Google Workspace email instead of Resend.**

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" (required for App Passwords)

### Step 2: Create App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" → "Other" → Name it "BerganCo SEO"
3. **Copy the 16-character password** (save it - you won't see it again!)

### Step 3: Add to .env

```env
# Gmail/Google Workspace SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="support@stuchai.com"
SMTP_PASSWORD="abcd efgh ijkl mnop"  # Your App Password here
REPORT_EMAIL_FROM="support@stuchai.com"
REPORT_EMAIL_TO="client@berganco.com"
```

---

## ✅ That's It!

Your emails will now send from `support@stuchai.com` - no Resend needed!

---

## 📘 Full Details

See **`GMAIL_SETUP.md`** for:
- Detailed step-by-step instructions
- Troubleshooting guide
- Google Workspace admin setup
- Testing your configuration

---

## 🆘 Common Issues

**"Invalid login"** → Make sure you're using an **App Password**, not your regular password

**Can't find App Passwords** → Make sure 2-Step Verification is enabled first

**Email goes to spam** → Check spam folder, mark as "Not Spam"

---

**Your emails will look professional:**
```
From: support@stuchai.com
Subject: Weekly SEO Report: ...
```

Perfect! 🎉

