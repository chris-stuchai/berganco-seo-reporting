# Why Numbers Don't Match: Common Causes & Solutions

## Understanding the Discrepancy

Your dashboard shows **317 clicks (30 days)** while Google Search Console shows **327 clicks (28 days)**.

### Key Differences to Check:

1. **Date Range Mismatch** ⚠️ **MOST COMMON**
   - **Google**: "Last 28 days" = 28 days
   - **Dashboard**: "30 Days" = 30 days
   - **Solution**: Compare the same exact date range. Google's "Last 28 days" vs our "30 days" will always differ.

2. **Missing Data Collection** ⚠️ **SECOND MOST COMMON**
   - Our system sums daily metrics from the database
   - If data wasn't collected for some days, the total will be lower
   - **Check**: Look at `dataPoints` in the API response - should equal the number of days selected

3. **Data Processing Delays**
   - Google Search Console data can take 2-3 days to finalize
   - Today's data might not be available yet
   - **Solution**: Compare excluding the last 2-3 days

4. **Time Zone Differences**
   - Date boundaries might not align perfectly
   - **Solution**: Usually minimal impact, but worth noting

## How to Verify Accuracy

### Step 1: Match Date Ranges Exactly

In Google Search Console:
- Note the exact date range (e.g., "Oct 3 - Oct 30" = 28 days)
- Select the same range in our dashboard

### Step 2: Check Data Coverage

Our dashboard now shows:
- `dataPoints`: Number of days we have data for
- `expectedDataPoints`: Number of days in the selected range
- `dataCoverage`: Percentage (e.g., 93.3% = missing 2 days)

If `dataCoverage < 100%`, that explains the discrepancy!

### Step 3: Collect Missing Data

1. Go to **Employee Portal**
2. Click **"Collect Now"** in System Controls
3. Or use the backfill feature to collect historical data

### Step 4: Compare Exact Dates

Once you have all data points:
- Google: Oct 3 - Oct 30 (28 days)
- Dashboard: Select the exact same dates
- Numbers should match within 1-2 clicks (due to processing delays)

## Quick Diagnostic

Add this to your browser console on the dashboard:
```javascript
fetch('/api/dashboard?days=30', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log({
    clicks: d.metrics.totalClicks,
    impressions: d.metrics.totalImpressions,
    dataPoints: d.metrics.dataPoints,
    expected: d.metrics.expectedDataPoints,
    coverage: d.metrics.dataCoverage.toFixed(1) + '%',
    missingDays: d.diagnostics.missingDays,
    dateRange: `${d.diagnostics.oldestDate} to ${d.diagnostics.newestDate}`
  }));
```

## Expected Behavior

- **100% Data Coverage + Same Date Range = Numbers Should Match**
- **Missing Days = Lower Totals** (this is normal until data is collected)
- **Different Date Ranges = Different Numbers** (always check this first!)

## Most Likely Cause Right Now

Based on your numbers (317 vs 327):
- **Missing ~2-3 days of data** OR
- **Date range mismatch** (30 days vs 28 days)

The dashboard will now show a warning if data is missing!

