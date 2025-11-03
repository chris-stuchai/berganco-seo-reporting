# Google Search Console Authentication Architecture

## How It Currently Works

### Single OAuth Account (Current Setup)

Your system uses **one Google OAuth account** (stored in environment variables) that has access to **all sites** in your Google Search Console:

```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REFRESH_TOKEN=xxx
```

### How Data Pulling Works Per Site

1. **Each Site has its own `googleSiteUrl`:**
   - BerganCo: `https://www.berganco.com`
   - Stuchai: `https://www.stuchai.com`

2. **When collecting data:**
   ```typescript
   // Data collector reads googleSiteUrl from Site record
   const site = await prisma.site.findUnique({
     where: { id: siteId },
     select: { googleSiteUrl: true }
   });
   
   // Passes that URL to Google Search Console API
   await fetchSiteMetrics(dateStr, dateStr, site.googleSiteUrl);
   ```

3. **Google Search Console API uses the `siteUrl` parameter:**
   ```typescript
   await searchConsole.searchanalytics.query({
     siteUrl: targetSiteUrl,  // "https://www.stuchai.com"
     requestBody: { ... }
   });
   ```

4. **The OAuth account must have access to ALL sites:**
   - When you added Stuchai to your Google Search Console, you authorized your OAuth account to access it
   - The same OAuth credentials can query any site you've authorized

### Data Isolation (Application Layer)

- **All data is stored with `siteId`** in the database
- **Client users only see data for sites they're assigned to** (via `ClientSite` table)
- This prevents Stuchai from seeing BerganCo data, even though the OAuth account has access to both

## Security Considerations

### Current Approach: ✅ Secure with Application-Level Isolation

**Pros:**
- Simple setup (one OAuth account)
- Easy to manage
- Data isolation enforced in application layer
- Clients can't access other clients' data

**Cons:**
- Single point of failure (if OAuth credentials are compromised, attacker has access to all sites)
- Can't easily revoke access for one client
- All data collection happens with same credentials

### Better Approach: Per-Client Service Accounts (Recommended for Enterprise)

**Option 1: Service Accounts (Most Secure)**

1. **Create one Google Service Account per client**
2. **Grant each service account access to only their site in GSC**
3. **Store service account keys securely** (encrypted, in database or secrets manager)
4. **Use service account for data collection per site**

**Benefits:**
- Complete credential isolation
- Can revoke one client's access without affecting others
- Better audit trail
- Client can't access other clients' data even if compromised

**Implementation Complexity:** High (requires service account setup per client)

### Option 2: Domain-Wide Delegation (Google Workspace Only)

If you're using Google Workspace:
- Use one service account with domain-wide delegation
- Grant access per-site at the domain level
- More flexible than individual service accounts

**Implementation Complexity:** Medium

## Recommendation

### For Your Current Setup (Small-Medium Scale)

**Keep the current approach** because:
1. ✅ Application-layer isolation is working (after our recent fixes)
2. ✅ Simpler to manage
3. ✅ No additional Google Cloud setup needed
4. ✅ Clients can't see each other's data

**Just ensure:**
- ✅ OAuth credentials are stored securely (environment variables, not in code)
- ✅ Regular credential rotation (change refresh token periodically)
- ✅ Monitor access logs for suspicious activity
- ✅ Clients only see data for their assigned sites (enforced in code)

### When to Upgrade to Service Accounts

Upgrade to per-client service accounts if:
- You have 10+ clients
- Clients require separate billing/accounting
- Compliance requires credential isolation
- You need to revoke access per-client frequently

## Current Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Google Search Console                                   │
│  ├── www.berganco.com (Property)                        │
│  └── www.stuchai.com (Property)                        │
└─────────────────────────────────────────────────────────┘
                    ▲
                    │
    ┌───────────────┴───────────────┐
    │                                │
    │   Single OAuth Account         │
    │   (Has access to ALL sites)   │
    │                                │
    └───────────────┬───────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Your Application                                       │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │  Site: BerganCo  │  │  Site: Stuchai   │          │
│  │  googleSiteUrl:  │  │  googleSiteUrl:  │          │
│  │  berganco.com    │  │  stuchai.com     │          │
│  └──────────────────┘  └──────────────────┘          │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │  User Access Control (ClientSite table)  │          │
│  │  - BerganCo user → only BerganCo site    │          │
│  │  - Stuchai user → only Stuchai site      │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

## How to Add a New Site

1. **Add site to Google Search Console** (if not already there)
2. **Verify OAuth account has access** (it should if you authorized it)
3. **Create Site record in database:**
   ```bash
   POST /api/sites
   {
     "domain": "www.newclient.com",
     "displayName": "New Client",
     "googleSiteUrl": "https://www.newclient.com",
     "ownerId": "<client-user-id>"
   }
   ```
4. **Site is automatically assigned to owner**
5. **Data collection will use the `googleSiteUrl` to query the correct property**

## FAQ

**Q: How does the system know which GSC property to query?**
A: The `googleSiteUrl` field in each Site record tells the API which property to query.

**Q: What if I add a site to GSC but don't authorize the OAuth account?**
A: Data collection will fail with an "access denied" error. You'll need to ensure the OAuth account has access to that property in Google Search Console.

**Q: Can Stuchai see BerganCo data?**
A: No. The application only returns data for sites the user is assigned to (via `ClientSite` table). Even though the OAuth account can access both, the application filters the data.

**Q: What if the OAuth credentials are compromised?**
A: The attacker would have access to all sites in your GSC account. This is why credential security is critical. Consider service accounts for better isolation.

**Q: Can I use different Google accounts for different clients?**
A: Not with the current architecture. You'd need to implement per-client authentication, which requires significant refactoring.

