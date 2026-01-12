# Send Test Emails RIGHT NOW! 📧

## Quick Access

I've added test buttons to your Employee Portal!

### Location:
**Employee Portal → System Controls Section**

You'll see two new orange/blue cards:

---

## 📬 Test Employee Email

**What it does:**
- Sends the weekly task summary email immediately
- Goes to: `chris@stuchai.com` and `stuart@stuchai.com`
- Shows all tasks for the current week across all clients

**How to use:**
1. Log in to Employee Portal
2. Scroll to "System Controls"
3. Find the orange "📬 Test Employee Email" card
4. Click "Send Now"
5. Confirm
6. Check your inbox!

**Expected result:**
```
✅ Employee email sent successfully!

Recipients: chris@stuchai.com, stuart@stuchai.com
Tasks: 12
```

---

## 📧 Test Client Report

**What it does:**
- Sends the BerganCo weekly SEO report
- Goes to: Whatever email you enter (default: `chris@stuchai.com`)
- Includes the new monthly comparison view

**How to use:**
1. Log in to Employee Portal
2. Scroll to "System Controls"
3. Find the blue "📧 Test Client Report" card
4. Enter your email (or keep the default)
5. Click "Send Now"
6. Confirm
7. Check your inbox!

**Expected result:**
```
✅ Client report sent successfully!

Site: BerganCo
Sent to: chris@stuchai.com
Clicks: 1,234
Impressions: 45,678
```

---

## Alternative: Use API Directly

If you prefer to trigger via API:

### Employee Email:
```bash
# Via curl (replace with your actual domain)
curl -X POST https://your-app.railway.app/api/admin/test-employee-email \
  -H "Cookie: your-auth-cookie" \
  -H "Content-Type: application/json"
```

### Client Report:
```bash
curl -X POST https://your-app.railway.app/api/admin/test-client-report \
  -H "Cookie: your-auth-cookie" \
  -H "Content-Type: application/json" \
  -d '{"testEmail":"chris@stuchai.com"}'
```

---

## What to Look For in Emails

### Employee Email (to you & Stuart):
✅ **Subject:** "Weekly Tasks Summary - Week of [Date] (X tasks)"

**Contains:**
- Summary stats (clients, tasks, urgent/high counts)
- Tasks grouped by client
- Each task with title, description, priority, status, due date
- AI-generated tasks marked with badge
- Link to Employee Portal

### Client Report (BerganCo):
✅ **Subject:** "Weekly SEO Report: [Date Range] | +XX% clicks"

**Contains:**
- **Weekly Performance** (last 7 days)
  - Clicks, impressions, CTR, position
  - Week-over-week changes
- **30-Day Trend** (NEW! - the monthly view you wanted)
  - Last 30 days vs previous 30 days
  - Month-over-month changes
- Charts & graphs
- Top pages & queries
- AI insights (optimistic tone)
- 2 AI-generated tasks (instead of 3-5)
- Recommendations

---

## Troubleshooting

### "Failed to send employee email"
**Check:**
1. EMPLOYEE_EMAILS is set on Railway:
   ```bash
   railway variables get EMPLOYEE_EMAILS
   ```
2. SMTP settings are configured
3. Railway logs for error details

### "Failed to send client report"
**Check:**
1. There's data in the database (run data collection first)
2. SMTP settings are correct
3. Railway logs for error details

### "No tasks found"
The employee email will only send if there are tasks for the current week. If none exist:
1. Go to Employee Portal
2. Create a test task for this week
3. Try sending the email again

---

## Next Steps After Testing

Once you've verified both emails work:

1. ✅ Confirm they look good
2. ✅ Check the monthly comparison in the client report
3. ✅ Verify AI tone is more optimistic
4. ✅ Confirm only 2 tasks appear (not 3-5)
5. ✅ You're done! They'll send automatically every Monday

**Monday Schedule:**
- **8 AM:** Client reports (to clients)
- **9 AM:** Employee task summary (to you & Stuart)

---

## Quick Summary

**To send both test emails RIGHT NOW:**

1. Go to: https://your-app.railway.app/employee
2. Scroll to "System Controls"
3. Click "Send Now" on both orange and blue test cards
4. Wait 30 seconds
5. Check your inbox at `chris@stuchai.com`

You should receive:
1. Employee weekly task summary
2. BerganCo weekly SEO report (with monthly comparison!)

**That's it!** 🎉
