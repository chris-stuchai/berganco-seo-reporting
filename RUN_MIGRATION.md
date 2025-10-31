# Run Migration Script on Railway

Since the migration script needs access to your Railway database, you need to run it **on Railway**, not locally.

## Quick Command

Run this command in your terminal (make sure you're logged into Railway):

```bash
railway run npm run migrate-berganco
```

The script will automatically find your admin user if you don't provide an email.

## With Admin Email

If you want to specify an admin email:

```bash
railway run npm run migrate-berganco your-admin@email.com
```

## What It Does

1. ✅ Finds or creates a Site record for BerganCo
2. ✅ Links all existing metrics to that site
3. ✅ Links your admin user as the site owner
4. ✅ Shows you exactly what was migrated

## Expected Output

You should see something like:

```
🔄 BerganCo Data Migration Script

This will:
1. Create a Site record for BerganCo
2. Link all existing metrics to that site
3. Link your admin user to that site

📧 No admin email provided, searching database for admin user...
✅ Found admin user: your@email.com

📍 Site Info:
   Domain: www.berganco.com
   Display Name: BerganCo
   Google Site URL: https://www.berganco.com
   Admin Email: your@email.com

📦 Creating Site record...
✅ Site created: www.berganco.com (ID: ...)

📊 Counting existing metrics...
   Total Daily Metrics: 150 (0 already linked, 150 to migrate)
   Total Page Metrics: 1200 (0 already linked, 1200 to migrate)
   Total Query Metrics: 800 (0 already linked, 800 to migrate)
   Total Weekly Reports: 12 (0 already linked, 12 to migrate)

🔄 Updating metrics with siteId...
   ✅ Updated 150 daily metrics
   ✅ Updated 1200 page metrics
   ✅ Updated 800 query metrics
   ✅ Updated 12 weekly reports

✅ Migration Complete!

Summary:
   Site: www.berganco.com (...)
   Daily Metrics: 150 updated
   Page Metrics: 1200 updated
   Query Metrics: 800 updated
   Weekly Reports: 12 updated
```

## After Migration

1. **Check Dashboard** - Visit your Railway URL and verify data appears
2. **Check Site Management** - Go to `/employee` and see BerganCo in site list
3. **Test Reports** - Generate a report to verify everything works

That's it! Your data is now migrated and ready for multi-tenant support. 🎉

