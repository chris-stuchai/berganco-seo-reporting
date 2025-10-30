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
 */
export async function collectDailyMetrics(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  console.log(`Collecting site metrics for ${dateStr}...`);

  try {
    const response = await fetchSiteMetrics(dateStr, dateStr);

    if (!response.rows || response.rows.length === 0) {
      console.log(`No data available for ${dateStr}`);
      return;
    }

    const row = response.rows[0];

    await prisma.dailyMetric.upsert({
      where: { date: new Date(dateStr) },
      update: {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      },
      create: {
        date: new Date(dateStr),
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      },
    });

    console.log(`✓ Stored daily metrics for ${dateStr}`);
  } catch (error) {
    console.error(`Error collecting daily metrics for ${dateStr}:`, error);
    throw error;
  }
}

/**
 * Collects and stores page-level metrics for a specific date
 */
export async function collectPageMetrics(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  console.log(`Collecting page metrics for ${dateStr}...`);

  try {
    const response = await fetchDailyPageMetrics(dateStr);

    if (!response.rows || response.rows.length === 0) {
      console.log(`No page data available for ${dateStr}`);
      return;
    }

    for (const row of response.rows) {
      const page = row.keys?.[0];
      if (!page) continue;

      await prisma.pageMetric.upsert({
        where: {
          date_page: {
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
          date: new Date(dateStr),
          page,
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        },
      });
    }

    console.log(`✓ Stored ${response.rows.length} page metrics for ${dateStr}`);
  } catch (error) {
    console.error(`Error collecting page metrics for ${dateStr}:`, error);
    throw error;
  }
}

/**
 * Collects and stores query-level metrics for a specific date
 */
export async function collectQueryMetrics(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  console.log(`Collecting query metrics for ${dateStr}...`);

  try {
    const response = await fetchDailyQueryMetrics(dateStr);

    if (!response.rows || response.rows.length === 0) {
      console.log(`No query data available for ${dateStr}`);
      return;
    }

    for (const row of response.rows) {
      const query = row.keys?.[0];
      if (!query) continue;

      await prisma.queryMetric.upsert({
        where: {
          date_query: {
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
          date: new Date(dateStr),
          query,
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        },
      });
    }

    console.log(`✓ Stored ${response.rows.length} query metrics for ${dateStr}`);
  } catch (error) {
    console.error(`Error collecting query metrics for ${dateStr}:`, error);
    throw error;
  }
}

/**
 * Collects all metrics for a specific date
 */
export async function collectAllMetrics(date: Date) {
  await collectDailyMetrics(date);
  await collectPageMetrics(date);
  await collectQueryMetrics(date);
}

/**
 * Backfills historical data for the last N days
 */
export async function backfillMetrics(days: number = 30) {
  console.log(`Backfilling metrics for the last ${days} days...`);

  for (let i = days; i >= 3; i--) {
    // GSC data has a 2-3 day delay
    const date = subDays(new Date(), i);
    await collectAllMetrics(date);
  }

  console.log('✓ Backfill complete');
}

