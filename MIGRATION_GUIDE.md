# BerganCo Data Migration Guide

This guide will help you migrate your existing BerganCo data to the new multi-tenant architecture. This is a **one-time operation** that links all your existing metrics to a Site record.

## Why Migrate?

With the new multi-tenant system, all metrics must be linked to a Site record. This allows the system to:
- Support multiple clients
- Isolate data per client
- Properly filter dashboards and reports

## Prerequisites

1. ✅ Database migrations have been run
2. ✅ You have admin access to the system
3. ✅ You know your admin email address

## Migration Steps

### Option 1: Run Migration Script (Recommended)

The migration script automatically:
1. Creates a Site record for BerganCo (if it doesn't exist)
2. Links all existing metrics to that site
3. Links your admin user as the site owner

#### Step 1: Set Environment Variables (Optional)

You can customize the migration by setting these environment variables:

```bash
export MIGRATE_DOMAIN="www.berganco.com"
export MIGRATE_DISPLAY_NAME="BerganCo"
export MIGRATE_GOOGLE_SITE_URL="https://www.berganco.com"
export MIGRATE_ADMIN_EMAIL="your-admin@email.com"
```

#### Step 2: Run the Migration

**On Railway (Recommended):**
```bash
# SSH into your Railway service or use Railway CLI
railway run npm run migrate-berganco <your-admin-email>
```

**Locally (if you have database access):**
```bash
npm run migrate-berganco <your-admin-email>
```

#### Step 3: Verify Migration

After running the script, check:

1. **Dashboard** - Should show all your existing data
2. **Site Management** - Should show BerganCo site in admin portal
3. **Reports** - Should generate correctly

### Option 2: Manual Migration via Admin Portal

If you prefer using the UI:

1. **Login to Admin Portal**
   - Go to `/employee`
   - Login with your admin credentials

2. **Create Site via Onboarding**
   - Click "+ Onboard New Client"
   - Fill in:
     - **Company/Display Name**: `BerganCo`
     - **Website Domain**: `www.berganco.com`
     - **Google Search Console URL**: `https://www.berganco.com`
     - **Client Account**: Use your existing admin email
   - Click "Create Client & Site"

3. **Run Migration Script**
   - Still need to run the script to link existing metrics:
   ```bash
   npm run migrate-berganco <your-admin-email>
   ```

## What Gets Migrated?

- ✅ **Daily Metrics** - All historical daily data
- ✅ **Page Metrics** - All page-level performance data
- ✅ **Query Metrics** - All search query data
- ✅ **Weekly Reports** - All generated reports

## After Migration

1. **Test the Dashboard**
   - Visit `/` and verify all data appears
   - Check date ranges and filters work

2. **Test Report Generation**
   - Go to Employee Portal → Generate Report
   - Verify report includes all historical data

3. **Verify Site Isolation**
   - When you add new clients, they should only see their own data
   - Your BerganCo data should remain separate

## Troubleshooting

### Error: "Admin user not found"
- Make sure you're using the exact email address you used to create the admin account
- Check your database: `SELECT * FROM "User" WHERE role = 'ADMIN';`

### Error: "Site already exists"
- This is fine! The script will skip site creation and just link metrics
- Verify the site exists in admin portal

### Data Not Showing After Migration
1. Check browser console for errors
2. Verify `siteId` is set in database:
   ```sql
   SELECT COUNT(*) FROM "DailyMetric" WHERE "siteId" IS NOT NULL;
   ```
3. Clear browser cache and refresh

### Need to Re-run Migration
The script is idempotent - you can run it multiple times safely. It will:
- Skip creating site if it exists
- Only update metrics that need linking
- Show you exactly what was updated

## Next Steps

After successful migration:

1. ✅ **Add New Clients** - Use the onboarding system for all new clients
2. ✅ **Data Collection** - Will automatically collect per-site going forward
3. ✅ **Reports** - Will automatically generate per-site
4. ✅ **Dashboard** - Will automatically filter by user's accessible sites

## Questions?

If you encounter any issues:
1. Check the migration script output for errors
2. Verify database schema matches migrations
3. Ensure your admin user exists and has correct role

---

**Important**: This migration is a **one-time operation**. Once complete, all new data will automatically be linked to sites. You won't need to run this again unless you're adding new historical data.

