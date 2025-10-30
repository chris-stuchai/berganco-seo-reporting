# 🔧 Fix Database Connection Issue

The error `Can't reach database server at postgres.railway.internal:5432` usually means:

## Possible Issues:

### 1. PostgreSQL Service Not Running
The PostgreSQL service might be stopped or sleeping.

**Fix:**
1. Go to Railway Dashboard
2. Click your **Postgres** service (🐘 icon)
3. Check if it's running (should show "Running" status)
4. If stopped, click "Start" or restart it

### 2. DATABASE_URL Not Set Correctly in Web Service
The web service needs to reference the Postgres service properly.

**Fix:**
1. Go to Railway Dashboard
2. Click your **web** service
3. Go to **Variables** tab
4. Check if `DATABASE_URL` exists
5. If it doesn't exist, or is wrong:
   - Click your **Postgres** service
   - Go to **Variables**
   - Copy the `DATABASE_URL` value
   - Go back to **web** service → Variables
   - Add/Update `DATABASE_URL` with the Postgres URL
   - Make sure it's the **public URL** format, not internal

### 3. Service Not Linked
The services might not be properly linked.

**Fix:**
1. Go to Railway Dashboard
2. Make sure both **web** and **Postgres** services are in the same project
3. The web service should automatically reference Postgres if linked

### 4. Use Public DATABASE_URL Instead

Sometimes Railway's internal networking doesn't work. Try using the public DATABASE_URL:

1. Go to Railway Dashboard
2. Click **Postgres** service
3. Go to **Variables** tab
4. Find `DATABASE_URL`
5. It should look like: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`
6. Copy this **entire URL**
7. Go to **web** service → Variables
8. Make sure `DATABASE_URL` matches exactly

---

## Quick Fix Steps:

1. **Verify Postgres is Running:**
   - Railway Dashboard → Postgres service
   - Status should be "Running"

2. **Check DATABASE_URL in Web Service:**
   - Railway Dashboard → web service → Variables
   - Should have `DATABASE_URL` pointing to Postgres

3. **Try Alternative Approach:**
   ```bash
   # Get the DATABASE_URL from Railway
   railway variables
   
   # Or check in dashboard and manually add it
   ```

4. **Use Public URL Format:**
   Make sure DATABASE_URL uses the public Railway domain, not internal:
   - ✅ `postgresql://postgres:...@containers-us-west-xxx.railway.app:5432/railway`
   - ❌ `postgresql://postgres:...@postgres.railway.internal:5432/railway`

---

## After Fixing:

Once DATABASE_URL is correct and Postgres is running:

```bash
railway run npm run migrate
```

This should work!

