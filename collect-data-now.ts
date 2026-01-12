#!/usr/bin/env tsx
/**
 * Collect Data Immediately
 * Run this to populate the database with 30 days of historical data
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';
import { collectAllMetrics } from './src/services/data-collector';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('\n🚀 Starting Data Collection\n');
  console.log('='.repeat(50));
  
  try {
    // Check sites
    const sites = await prisma.site.findMany({
      where: { isActive: true }
    });
    
    if (sites.length === 0) {
      console.log('❌ No active sites found!');
      console.log('\nYou need to create a site first.');
      console.log('Go to Employee Portal → Onboard Client');
      process.exit(1);
    }
    
    console.log(`\n✓ Found ${sites.length} active site(s):`);
    sites.forEach(s => console.log(`  - ${s.displayName} (${s.domain})`));
    
    // Check existing data
    const existingMetrics = await prisma.dailyMetric.count();
    console.log(`\n📊 Current database: ${existingMetrics} daily metrics`);
    
    if (existingMetrics > 100) {
      console.log('\n✓ You already have data! Email should show metrics.');
      console.log('If email is still empty, the site might not have Google Search Console data yet.');
      await prisma.$disconnect();
      return;
    }
    
    console.log('\n📥 Collecting last 30 days of data...');
    console.log('This will take 2-5 minutes. Please wait...\n');
    
    const daysToCollect = 30;
    
    for (const site of sites) {
      console.log(`\n📊 Collecting for: ${site.displayName}`);
      
      for (let i = daysToCollect; i >= 3; i--) {
        const date = subDays(new Date(), i);
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          await collectAllMetrics(date, site.id, site.googleSiteUrl);
          process.stdout.write(`  ✓ ${dateStr} `);
        } catch (error) {
          process.stdout.write(`  ✗ ${dateStr} `);
        }
        
        // Progress indicator
        if ((daysToCollect - i + 1) % 7 === 0) {
          console.log(`  (${daysToCollect - i + 1}/${daysToCollect - 3})`);
        }
      }
      console.log('');
    }
    
    // Summary
    const finalCount = await prisma.dailyMetric.count();
    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Data collection complete!`);
    console.log(`   Total metrics now: ${finalCount}`);
    console.log(`   Collected: ${finalCount - existingMetrics} new records\n`);
    
    if (finalCount > 0) {
      const recentSample = await prisma.dailyMetric.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { site: { select: { displayName: true } } }
      });
      
      console.log('📊 Recent data sample:');
      recentSample.forEach(m => {
        console.log(`   ${m.date.toISOString().split('T')[0]} | ${m.site.displayName} | ${m.clicks} clicks, ${m.impressions} impressions`);
      });
      console.log('');
    }
    
    console.log('🎉 You can now send test emails with real data!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
