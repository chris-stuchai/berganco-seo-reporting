# Railway Migration Steps - Quick Guide

## Step 1: Link Your Railway Project

Run this command and select your project when prompted:

```bash
cd "/Users/chris/BerganCo SEO Reporting"
railway link
```

You'll see a list of your Railway projects. Select the one for your SEO reporting system.

## Step 2: Run the Migration

Once linked, run:

```bash
railway run npm run migrate-berganco
```

The script will:
- Automatically find your admin user
- Create the BerganCo site (if needed)
- Link all existing data to that site
- Show you a summary of what was migrated

## Alternative: If Railway CLI Isn't Working

You can also run the migration through Railway's web interface:

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your project**
3. **Click on your service** (the web service, not the database)
4. **Go to "Deployments" tab** → Click on latest deployment
5. **Open "Logs" or "Terminal"**
6. **Run**: `npm run migrate-berganco`

Or use Railway's **"Shell"** feature if available in your service settings.

## Verify Migration Worked

After running, check:

1. **Dashboard** - Visit your Railway URL and verify data appears
2. **Admin Portal** - Go to `/employee` and check "Site Management" section
3. **Should see**: BerganCo site listed with all metrics linked

## Need Help?

If you get errors:
- Make sure you're logged into Railway: `railway login`
- Make sure your project is linked: `railway link`
- Check that your database is running and accessible

---

**That's it!** Once the migration runs successfully, your system will be ready for multiple clients. 🚀

