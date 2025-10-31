# Client Onboarding Guide

This guide explains how to onboard new clients and their websites to the SEO platform.

## Architecture Overview

The platform now supports **multi-tenant architecture** where:
- Each website is represented as a `Site` with its own domain and Google Search Console URL
- Clients (users with `CLIENT` role) can be assigned to one or more sites
- All SEO data (metrics, reports, tasks) is scoped to specific sites
- Clients only see data for sites they own or are assigned to
- Admins and Employees can see all sites

## Database Schema

### Site Model
- `id`: Unique site identifier
- `domain`: Website domain (e.g., "www.stuchai.com")
- `displayName`: Human-readable name (e.g., "Stuchai")
- `googleSiteUrl`: Full Google Search Console URL (e.g., "https://www.stuchai.com")
- `ownerId`: Primary owner (User ID)
- `isActive`: Whether the site is active

### ClientSite Junction Table
- Links users to sites they have access to
- Allows clients to have access to multiple sites

## Onboarding Methods

### Method 1: Using the API (Recommended)

#### Step 1: Create or Find the Client User
```bash
POST /api/users
{
  "email": "owner@client.com",
  "password": "SecurePassword123!",
  "name": "Client Name",
  "role": "CLIENT",
  "sendOnboardingEmail": true
}
```

#### Step 2: Create the Site
```bash
POST /api/sites
{
  "domain": "www.stuchai.com",
  "displayName": "Stuchai",
  "googleSiteUrl": "https://www.stuchai.com",
  "ownerId": "<user-id-from-step-1>"
}
```

The site will automatically be assigned to the owner.

#### Step 3: Assign Site to Additional Clients (Optional)
```bash
POST /api/sites/:siteId/assign
{
  "userId": "<additional-client-user-id>"
}
```

### Method 2: Using the Onboarding Script

```bash
ts-node src/scripts/onboard-client.ts \
  www.stuchai.com \
  Stuchai \
  support@stuchai.com \
  https://www.stuchai.com
```

This script will:
1. Create or find the owner user
2. Create the site
3. Assign the site to the owner
4. Display a summary with next steps

### Method 3: Direct Database (Advanced)

You can also create sites directly via Prisma/PostgreSQL, but the API methods are recommended.

## Onboarding Stuchai.com as a Test Client

To onboard your own website (`www.stuchai.com`) as a test:

### Via API:
```bash
# 1. Create Stuchai client user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<admin-session-token>" \
  -d '{
    "email": "support@stuchai.com",
    "password": "SecurePassword123!",
    "name": "Stuchai Support",
    "role": "CLIENT",
    "businessName": "Stuchai LLC"
  }'

# 2. Get the user ID from response, then create site
curl -X POST http://localhost:3000/api/sites \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<admin-session-token>" \
  -d '{
    "domain": "www.stuchai.com",
    "displayName": "Stuchai",
    "googleSiteUrl": "https://www.stuchai.com",
    "ownerId": "<user-id-from-step-1>"
  }'
```

### Via Script:
```bash
ts-node src/scripts/onboard-client.ts \
  www.stuchai.com \
  Stuchai \
  support@stuchai.com
```

## Important Notes

### Google Search Console Access

**Critical**: The Google OAuth token used by the platform must have access to **all sites** you want to track.

1. When you set up Google OAuth, ensure the account has access to:
   - `www.berganco.com` (existing)
   - `www.stuchai.com` (new)
   - Any other sites you want to track

2. You can verify access in [Google Search Console](https://search.google.com/search-console)

3. If a site is not accessible, data collection will fail for that site

### Data Collection

After onboarding a site:

1. **Manual Collection**: Use the "Sync" button in the dashboard or call:
   ```bash
   POST /api/collect
   {
     "siteId": "<site-id>",
     "days": 30
   }
   ```

2. **Automatic Collection**: Update cron jobs in `src/index.ts` to collect data for all active sites

### Data Isolation

- Clients **only** see data for sites they own or are assigned to
- Dashboard queries automatically filter by user's accessible sites
- Reports are scoped to specific sites
- Tasks can be assigned to clients, and will show their site data

## Admin Portal Features

Once sites are created, admins can:

1. **View All Sites**: `GET /api/sites`
2. **Assign Sites to Clients**: `POST /api/sites/:siteId/assign`
3. **Unassign Sites**: `DELETE /api/sites/:siteId/assign/:userId`
4. **View User's Sites**: `GET /api/sites/my-sites` (for the authenticated user)

## Migration from Single-Site

If you have existing data from before multi-tenant support:

1. A default "BerganCo" site will be created automatically
2. Existing data will need to be migrated to include `siteId`
3. Run the migration: `npx prisma migrate deploy`

## Next Steps After Onboarding

1. ✅ Verify Google Search Console access
2. ✅ Run initial data collection
3. ✅ Configure report schedules (if needed)
4. ✅ Client can login and view their dashboard
5. ✅ Set up weekly email reports

## Troubleshooting

### "Site not found" errors
- Ensure the site was created via `/api/sites`
- Check that the user has access via `ClientSite` junction table

### "No data available" in dashboard
- Verify Google Search Console access for that site
- Run manual data collection
- Check that `siteId` is being passed to data collection functions

### Data not showing for client
- Verify client is assigned to the site (check `ClientSite` table)
- Verify site is active (`isActive = true`)
- Check that data collection included the correct `siteId`

