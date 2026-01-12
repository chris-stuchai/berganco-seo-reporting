# Employee Weekly Task Email Setup

## Overview

Automatically sends a weekly email every Monday at 9 AM to you and your team with a summary of all tasks across all client websites.

## Features

✅ **Weekly Task Summary** - All tasks for the current week, organized by client  
✅ **Priority Breakdown** - See urgent, high, medium, and low priority tasks at a glance  
✅ **Status Overview** - Pending, in progress, and completed counts per client  
✅ **AI Task Identification** - AI-generated tasks are clearly marked  
✅ **Quick Access** - Direct link to employee portal to manage tasks  

## Setup

### 1. Set Environment Variable

Add this to your Railway environment variables (or `.env` file):

```bash
EMPLOYEE_EMAILS="Chris <chris@stuchai.com>, Stuart <stuart@stuchai.com>"
```

**Format Options:**

```bash
# Option 1: Names with emails (recommended)
EMPLOYEE_EMAILS="Chris <chris@stuchai.com>, Stuart CEO <stuart@stuchai.com>"

# Option 2: Just emails
EMPLOYEE_EMAILS="chris@stuchai.com, stuart@stuchai.com"

# Option 3: Single recipient
EMPLOYEE_EMAILS="chris@stuchai.com"
```

### 2. Add to Railway

```bash
railway variables set EMPLOYEE_EMAILS="Chris <chris@stuchai.com>, Stuart <stuart@stuchai.com>"
```

### 3. Verify SMTP Settings

Make sure these are already set (they should be from your client email setup):

```bash
SMTP_USER="your-gmail@domain.com"
SMTP_PASSWORD="your-app-password"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
```

## Email Schedule

| Time | Day | Email Type | Recipients |
|------|-----|------------|-----------|
| **8 AM** | Monday | Client Reports | Clients (REPORT_EMAIL_TO) |
| **9 AM** | Monday | Employee Task Summary | Team (EMPLOYEE_EMAILS) |

## What's Included in the Email

### Summary Stats
- Total number of clients
- Total number of tasks
- Urgent task count
- High priority task count

### Tasks by Client
For each client, you'll see:
- Client name/business name
- All tasks with:
  - Task title
  - Description
  - Priority (Urgent, High, Medium, Low)
  - Status (Pending, In Progress, Completed)
  - Due date
  - AI indicator (if AI-generated)
- Status breakdown (pending, in progress, completed counts)

### Quick Actions
- Direct link to Employee Portal to manage all tasks

## Testing

### Test the Email Immediately

You can trigger the employee email manually without waiting for Monday:

```bash
# On Railway
railway run npx tsx -e "
import { sendEmployeeWeeklySummary } from './src/services/employee-email-service';
const recipients = [
  { name: 'Chris', email: 'chris@stuchai.com' },
  { name: 'Stuart', email: 'stuart@stuchai.com' }
];
sendEmployeeWeeklySummary(recipients).then(() => console.log('Email sent!'));
"
```

Or create a test endpoint (temporary):

```typescript
// Add to src/index.ts
app.get('/api/test/employee-email', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { sendEmployeeWeeklySummary } = await import('./services/employee-email-service');
    const recipients = [
      { name: 'Chris', email: 'chris@stuchai.com' },
      { name: 'Stuart', email: 'stuart@stuchai.com' }
    ];
    const result = await sendEmployeeWeeklySummary(recipients);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

Then visit: `https://your-app.railway.app/api/test/employee-email`

## Bulk Task Actions in Dashboard

### New Features Added:

1. **Show Filter** - Control how many tasks display (10, 25, 50, 100, or All)

2. **✓ Complete All** - Mark all visible tasks as complete with one click

3. **🗑️ Delete Completed** - Remove all completed tasks to clean up your list

### Location:
Employee Portal → Weekly Tasks section → Filter & action buttons at the top

## Email Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📬 Weekly Tasks Summary
Week of Jan 13 - Jan 19, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY
├─ 3 Clients
├─ 8 Total Tasks
├─ 2 Urgent
└─ 3 High Priority

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 Bergan & Company
   2 Pending | 1 In Progress | 0 Completed
   
   ⚠️  URGENT: Fix broken links on homepage [AI]
   Description: Multiple 404 errors detected...
   Due: Jan 15, 2026 • Status: PENDING
   
   🔶 HIGH: Optimize meta descriptions
   Description: Top 5 pages need better CTR...
   Due: Jan 18, 2026 • Status: IN_PROGRESS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 Client Site 2
   ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Go to Employee Portal →]
```

## Troubleshooting

### Email Not Sending?

1. **Check environment variable is set:**
   ```bash
   railway variables get EMPLOYEE_EMAILS
   ```

2. **Check SMTP settings:**
   ```bash
   railway variables get SMTP_USER
   railway variables get SMTP_PASSWORD
   ```

3. **Check Railway logs:**
   ```bash
   railway logs | grep "employee weekly"
   ```

### Want to Change Recipients?

```bash
# Update the variable
railway variables set EMPLOYEE_EMAILS="New Name <new@email.com>, Another <another@email.com>"

# Restart the service (it will read new env vars)
railway up
```

### Want Different Schedule?

The cron schedule is set to `0 9 * * 1` (9 AM every Monday).

To change it, edit `src/index.ts`:

```typescript
// Current: Monday 9 AM
cron.schedule('0 9 * * 1', async () => { ... });

// Examples:
cron.schedule('0 8 * * 1', async () => { ... }); // Monday 8 AM
cron.schedule('0 9 * * 5', async () => { ... }); // Friday 9 AM
cron.schedule('0 9 * * 1,5', async () => { ... }); // Monday & Friday 9 AM
```

## Summary

✅ Add `EMPLOYEE_EMAILS` environment variable  
✅ Email sends automatically every Monday at 9 AM  
✅ Includes all tasks for all clients for the week  
✅ Organized by client with priority and status indicators  
✅ Direct link to manage tasks in Employee Portal  
✅ Bulk actions available in dashboard (Complete All, Delete Completed)  

**Set it up once, get weekly task summaries forever!** 🎉
