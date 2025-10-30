# Data Accuracy Verification

## How Our Data Collection Works

Our system pulls data **directly from Google Search Console API** - the same source that powers the Google Search Console interface you see at `https://search.google.com/search-console`.

### Data Collection Process

1. **Daily Collection**: The system collects metrics for each day by calling:
   ```
   Google Search Console API → /searchanalytics/query
   ```

2. **What We Collect**:
   - Total clicks per day
   - Total impressions per day  
   - Average CTR (Click-Through Rate)
   - Average position

3. **Data Storage**: Metrics are stored in our database with timestamps for historical tracking.

### Why Numbers Might Differ

**Google Search Console UI shows aggregated data over a selected period.**
- Google's UI: Shows totals for the selected date range (e.g., "Last 3 months")
- Our System: Stores daily snapshots and aggregates them for the selected period

### Accuracy Verification Steps

1. **Check Date Range**: 
   - Google shows "Last 3 months" = ~90 days
   - Make sure you're comparing the same date range in our dashboard

2. **Data Collection Status**:
   - Go to Employee Portal → System Controls
   - Click "Collect Now" to ensure recent data is synced
   - Historical data can be backfilled using the admin panel

3. **Verify API Connection**:
   - The system uses the same Google OAuth credentials
   - Same site URL: `https://www.berganco.com`
   - Same API endpoints as Google's interface

### Example: Google Shows 372 Clicks (3 months)

If Google Search Console shows **372 clicks** for "Last 3 months":

1. **In our dashboard**, select **90 days** to match
2. **Sum of daily clicks** for the last 90 days should match
3. **If it doesn't match**:
   - Click "Collect Now" in Employee Portal to sync recent days
   - Use backfill feature to collect historical data
   - Verify the date range matches exactly

### Data Accuracy Guarantee

Our data comes from the **same Google Search Console API**** that powers their interface. Any discrepancies are likely due to:

1. **Date range differences** (most common)
2. **Missing historical data** (not collected yet)
3. **Time zone differences** (rare, but possible)
4. **Data processing delays** (Google can take 2-3 days to finalize)

### Recommended Actions

1. ✅ **Backfill Historical Data**: 
   - Employee Portal → System Controls → Collect Data
   - Or use the backfill API to collect past 90 days

2. ✅ **Verify Date Ranges Match**:
   - Google: "Last 3 months" 
   - Dashboard: Select "90 days"

3. ✅ **Check Data Collection Status**:
   - Ensure daily collection is running
   - Verify no errors in collection logs

### Need Help?

If numbers still don't match after verifying:
1. Check the exact date range Google is showing
2. Ensure data collection has run for all days in that range
3. Contact support with the specific discrepancy

