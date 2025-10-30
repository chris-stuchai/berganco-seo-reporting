#!/usr/bin/env tsx

/**
 * Data Collection Script
 * 
 * Collects SEO metrics from Google Search Console and stores them in the database
 * Run this daily (via cron or Railway scheduled job)
 */

import * as dotenv from 'dotenv';
import { subDays } from 'date-fns';
import { collectAllMetrics, backfillMetrics } from '../services/data-collector';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('\n📊 BerganCo SEO Data Collection\n');

  try {
    if (command === 'backfill') {
      const days = parseInt(args[1]) || 30;
      console.log(`Starting backfill for the last ${days} days...\n`);
      await backfillMetrics(days);
    } else {
      // Collect data for 3 days ago (GSC data has 2-3 day delay)
      const date = subDays(new Date(), 3);
      console.log(`Collecting metrics for ${date.toISOString().split('T')[0]}...\n`);
      await collectAllMetrics(date);
    }

    console.log('\n✅ Data collection complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error collecting data:', error);
    process.exit(1);
  }
}

main();

