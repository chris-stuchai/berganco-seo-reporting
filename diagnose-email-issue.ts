#!/usr/bin/env tsx
/**
 * Diagnose and Fix Empty Weekly Email Issue
 * 
 * This script will:
 * 1. Check if sites are configured
 * 2. Check if daily data exists
 * 3. Check scheduled job configuration
 * 4. Optionally backfill missing data
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { subDays, format } from 'date-fns';

dotenv.config();

const prisma = new PrismaClient();

async function diagnose() {
  console.log('\n🔍 Diagnosing Empty Weekly Email Issue\n');
  console.log('='.repeat(50));
  
  // Step 1: Check sites
  console.log('\n1️⃣  Checking Sites Configuration...');
  const sites = await prisma.site.findMany({
    include: {
      owner: {
        select: { email: true, name: true }
      }
    }
  });
  
  if (sites.length === 0) {
    console.log('❌ NO SITES FOUND!');
    console.log('   You need to create a site first.');
    console.log('   Run: npx tsx src/scripts/onboard-client.ts');
    return false;
  }
  
  console.log(`✓ Found ${sites.length} site(s):`);
  for (const site of sites) {
    console.log(`  - ${site.displayName} (${site.domain})`);
    console.log(`    Google Search Console URL: ${site.googleSiteUrl}`);
    console.log(`    Active: ${site.isActive ? 'Yes' : 'No'}`);
    console.log(`    Owner: ${site.owner.name} (${site.owner.email})`);
  }
  
  // Step 2: Check daily metrics
  console.log('\n2️⃣  Checking Daily Metrics Data...');
  const totalMetrics = await prisma.dailyMetric.count();
  
  if (totalMetrics === 0) {
    console.log('❌ NO DAILY METRICS FOUND!');
    console.log('   This is why your emails are empty.');
    console.log('   The daily data collection job may not be running.');
    return true; // Continue to show more info
  }
  
  console.log(`✓ Found ${totalMetrics} daily metric records`);
  
  // Check per site
  for (const site of sites) {
    const siteMetrics = await prisma.dailyMetric.findMany({
      where: { siteId: site.id },
      orderBy: { date: 'desc' },
      take: 7
    });
    
    if (siteMetrics.length === 0) {
      console.log(`  ❌ ${site.displayName}: NO DATA`);
    } else {
      const latest = siteMetrics[0];
      console.log(`  ✓ ${site.displayName}: ${siteMetrics.length} recent records`);
      console.log(`    Latest: ${format(latest.date, 'yyyy-MM-dd')} - ${latest.clicks} clicks, ${latest.impressions} impressions`);
    }
  }
  
  // Step 3: Check scheduled jobs configuration
  console.log('\n3️⃣  Checking Scheduled Jobs Configuration...');
  const schedules = await prisma.scheduleConfig.findMany();
  
  if (schedules.length === 0) {
    console.log('⚠️  No schedule configurations found');
    console.log('   Jobs will still run with default cron schedule');
  } else {
    for (const schedule of schedules) {
      console.log(`  ${schedule.jobType}:`);
      console.log(`    Enabled: ${schedule.isEnabled ? 'Yes' : 'No'}`);
      console.log(`    Cron: ${schedule.cronExpression}`);
      console.log(`    Last Run: ${schedule.lastRun ? format(schedule.lastRun, 'yyyy-MM-dd HH:mm:ss') : 'Never'}`);
    }
  }
  
  // Step 4: Check recent reports
  console.log('\n4️⃣  Checking Recent Reports...');
  const recentReports = await prisma.weeklyReport.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      site: {
        select: { displayName: true }
      }
    }
  });
  
  if (recentReports.length === 0) {
    console.log('⚠️  No reports generated yet');
  } else {
    for (const report of recentReports) {
      console.log(`  ${report.site.displayName}:`);
      console.log(`    Week: ${format(report.weekStartDate, 'MMM d')} - ${format(report.weekEndDate, 'MMM d, yyyy')}`);
      console.log(`    Clicks: ${report.totalClicks}, Impressions: ${report.totalImpressions}`);
      console.log(`    Sent: ${report.sentAt ? format(report.sentAt, 'yyyy-MM-dd HH:mm:ss') : 'Not sent'}`);
    }
  }
  
  // Step 5: Environment check
  console.log('\n5️⃣  Checking Environment Variables...');
  const requiredVars = [
    'DATABASE_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'REPORT_EMAIL_TO'
  ];
  
  let allVarsPresent = true;
  for (const varName of requiredVars) {
    const isSet = !!process.env[varName];
    console.log(`  ${isSet ? '✓' : '❌'} ${varName}: ${isSet ? 'Set' : 'NOT SET'}`);
    if (!isSet) allVarsPresent = false;
  }
  
  return allVarsPresent && totalMetrics > 0;
}

async function fix(autoFix: boolean = false) {
  console.log('\n\n🔧 Fixing the Issue\n');
  console.log('='.repeat(50));
  
  const sites = await prisma.site.findMany({
    where: { isActive: true }
  });
  
  if (sites.length === 0) {
    console.log('❌ Cannot fix: No active sites found');
    return;
  }
  
  console.log('\nI will now backfill the last 30 days of data for all active sites.');
  console.log('This will populate your database with historical data from Google Search Console.');
  console.log('\nNote: Google Search Console data has a 2-3 day delay, so data from the');
  console.log('last 2-3 days may not be available yet.\n');
  
  let shouldFix = autoFix;
  
  if (!autoFix) {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>(resolve => {
      rl.question('Do you want to backfill data now? (yes/no): ', resolve);
    });
    rl.close();
    
    shouldFix = answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
  }
  
  if (!shouldFix) {
    console.log('\nSkipping backfill. You can run it later with:');
    console.log('  npx tsx src/scripts/collect-data.ts backfill 30');
    return;
  }
  
  console.log('\n📊 Starting data backfill...\n');
  
  const { backfillMetrics } = await import('./src/services/data-collector');
  await backfillMetrics(30);
  
  console.log('\n✅ Backfill complete!');
  console.log('\nYou can now test the email by running:');
  console.log('  npx tsx src/scripts/generate-report.ts');
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const autoFix = args.includes('--fix') || args.includes('--auto-fix');
    const noInteractive = args.includes('--no-interactive');
    
    const isHealthy = await diagnose();
    
    console.log('\n' + '='.repeat(50));
    
    if (isHealthy) {
      console.log('\n✅ System looks healthy!');
      console.log('\nIf emails are still empty, the weekly cron job may be');
      console.log('running before the daily collection job completes.');
    } else {
      console.log('\n⚠️  Issues detected!');
      
      if (noInteractive) {
        console.log('\nTo fix, run one of these commands:');
        console.log('\n  On Railway:');
        console.log('    railway run npx tsx src/scripts/collect-data.ts backfill 30');
        console.log('\n  Locally:');
        console.log('    npx tsx src/scripts/collect-data.ts backfill 30');
      } else {
        await fix(autoFix);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
