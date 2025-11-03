/**
 * Data Collection Service
 * 
 * Collects daily SEO metrics from Google Search Console and stores them in the database
 */

import { PrismaClient } from '@prisma/client';
import { format, subDays } from 'date-fns';
import {
  fetchSiteMetrics,
  fetchDailyPageMetrics,
  fetchDailyQueryMetrics,
} from './search-console';

const prisma = new PrismaClient();

/**
 * Collects and stores overall site metrics for a specific date
 * @param date - Date to collect metrics for
 * @param siteId - Site ID to associate metrics with
 * @param siteUrl - Google Search Console site URL (optional, will fetch from Site model if not provided)
 */
export async function collectDailyMetrics(date: Date, siteId: string, siteUrl?: string) {
  const dateStr = format(date, 'yyyy-MM-dd');
  console.log(`Collecting site metrics for ${dateStr} (site: ${siteId})...`);

  try {
    // If siteUrl not provided, fetch from database
    let targetSiteUrl = siteUrl;
    if (!targetSiteUrl) {
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        select: { googleSiteUrl: true },
      });
      if (!site) {
        throw new Error(`Site ${siteId} not found`);
      }
      targetSiteUrl = site.googleSiteUrl;
    }

    const response = await fetchSiteMetrics(dateStr, dateStr, targetSiteUrl);

    // Even if Google returns no data, we should store a record with zeros
    // This ensures the dashboard knows we've checked this date
    const row = response.rows && response.rows.length > 0 
      ? response.rows[0]
      : { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    
    if (!response.rows || response.rows.length === 0) {
      console.log(`No data available for ${dateStr} - storing zero values`);
    }

    await prisma.dailyMetric.upsert({
      where: {
        siteId_date: {
          siteId,
          date: new Date(dateStr),
        },
      },
      update: {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      },
      create: {
        siteId,
        date: new Date(dateStr),
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      },
    });

    console.log(`✓ Stored daily metrics for ${dateStr} (site: ${siteId})`);
  } catch (error) {
    // Log error but don't throw - we want to continue collecting for other sites/dates
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error collecting daily metrics for ${dateStr} (site: ${siteId}):`, errorMessage);
    
    // If it's an invalid URL error, log it clearly
    if (errorMessage.includes('not a valid Search Console site URL')) {
      console.error(`⚠️  Invalid Google Site URL for site ${siteId}. Please check the site configuration.`);
    }
    
    // Don't throw - allow sync to continue with other dates/sites
    // This prevents one bad site from blocking all data collection
  }
}

/**
 * Collects and stores page-level metrics for a specific date
 * @param date - Date to collect metrics for
 * @param siteId - Site ID to associate metrics with
 * @param siteUrl - Google Search Console site URL (optional)
 */
export async function collectPageMetrics(date: Date, siteId: string, siteUrl?: string) {
  const dateStr = format(date, 'yyyy-MM-dd');
  console.log(`Collecting page metrics for ${dateStr} (site: ${siteId})...`);

  try {
    let targetSiteUrl = siteUrl;
    if (!targetSiteUrl) {
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        select: { googleSiteUrl: true },
      });
      if (!site) {
        throw new Error(`Site ${siteId} not found`);
      }
      targetSiteUrl = site.googleSiteUrl;
    }

    const response = await fetchDailyPageMetrics(dateStr, targetSiteUrl);

    if (!response.rows || response.rows.length === 0) {
      console.log(`No page data available for ${dateStr}`);
      return;
    }

    for (const row of response.rows) {
      const page = row.keys?.[0];
      if (!page) continue;

      await prisma.pageMetric.upsert({
        where: {
          siteId_date_page: {
            siteId,
            date: new Date(dateStr),
            page,
          },
        },
        update: {
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        },
        create: {
          siteId,
          date: new Date(dateStr),
          page,
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        },
      });
    }

    console.log(`✓ Stored ${response.rows.length} page metrics for ${dateStr} (site: ${siteId})`);
  } catch (error) {
    console.error(`Error collecting page metrics for ${dateStr}:`, error);
    throw error;
  }
}

/**
 * Collects and stores query-level metrics for a specific date
 * @param date - Date to collect metrics for
 * @param siteId - Site ID to associate metrics with
 * @param siteUrl - Google Search Console site URL (optional)
 */
export async function collectQueryMetrics(date: Date, siteId: string, siteUrl?: string) {
  const dateStr = format(date, 'yyyy-MM-dd');
  console.log(`Collecting query metrics for ${dateStr} (site: ${siteId})...`);

  try {
    let targetSiteUrl = siteUrl;
    if (!targetSiteUrl) {
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        select: { googleSiteUrl: true },
      });
      if (!site) {
        throw new Error(`Site ${siteId} not found`);
      }
      targetSiteUrl = site.googleSiteUrl;
    }

    const response = await fetchDailyQueryMetrics(dateStr, targetSiteUrl);

    if (!response.rows || response.rows.length === 0) {
      console.log(`No query data available for ${dateStr}`);
      return;
    }

    for (const row of response.rows) {
      const query = row.keys?.[0];
      if (!query) continue;

      await prisma.queryMetric.upsert({
        where: {
          siteId_date_query: {
            siteId,
            date: new Date(dateStr),
            query,
          },
        },
        update: {
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        },
        create: {
          siteId,
          date: new Date(dateStr),
          query,
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        },
      });
    }

    console.log(`✓ Stored ${response.rows.length} query metrics for ${dateStr} (site: ${siteId})`);
  } catch (error) {
    console.error(`Error collecting query metrics for ${dateStr}:`, error);
    throw error;
  }
}

/**
 * Collects all metrics for a specific date and site
 * @param date - Date to collect metrics for
 * @param siteId - Site ID to associate metrics with
 * @param siteUrl - Google Search Console site URL (optional)
 */
export async function collectAllMetrics(date: Date, siteId: string, siteUrl?: string) {
  await collectDailyMetrics(date, siteId, siteUrl);
  await collectPageMetrics(date, siteId, siteUrl);
  await collectQueryMetrics(date, siteId, siteUrl);
}

/**
 * Backfills historical data for the last N days for all active sites
 */
export async function backfillMetrics(days: number = 30) {
  console.log(`Backfilling metrics for the last ${days} days...`);

  // Get all active sites
  const activeSites = await prisma.site.findMany({
    where: { isActive: true },
  });

  if (activeSites.length === 0) {
    console.log('⚠️  No active sites found, skipping backfill');
    return;
  }

  for (const site of activeSites) {
    console.log(`Backfilling for site: ${site.domain}`);
    for (let i = days; i >= 3; i--) {
      // GSC data has a 2-3 day delay
      const date = subDays(new Date(), i);
      await collectAllMetrics(date, site.id, site.googleSiteUrl);
    }
  }

  console.log('✓ Backfill complete');
}

