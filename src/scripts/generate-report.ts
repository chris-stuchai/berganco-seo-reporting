#!/usr/bin/env tsx

/**
 * Weekly Report Generation Script
 * 
 * Generates and sends weekly SEO reports
 * Run this weekly (Monday mornings recommended)
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { generateWeeklyReport } from '../services/report-generator';
import { sendWeeklyReport } from '../services/email-service';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('\n📧 Generating Weekly SEO Report\n');

  try {
    // Generate report
    const result = await generateWeeklyReport();

    console.log('\n📊 Report Summary:');
    console.log(`Week: ${result.report.weekStartDate.toISOString().split('T')[0]} to ${result.report.weekEndDate.toISOString().split('T')[0]}`);
    console.log(`Total Clicks: ${result.currentMetrics.totalClicks.toLocaleString()}`);
    console.log(`Total Impressions: ${result.currentMetrics.totalImpressions.toLocaleString()}`);
    console.log(`Average CTR: ${(result.currentMetrics.averageCtr * 100).toFixed(2)}%`);
    console.log(`Average Position: ${result.currentMetrics.averagePosition.toFixed(1)}`);
    console.log(`\nChanges vs Previous Week:`);
    console.log(`Clicks: ${result.report.clicksChange > 0 ? '+' : ''}${result.report.clicksChange.toFixed(1)}%`);
    console.log(`Impressions: ${result.report.impressionsChange > 0 ? '+' : ''}${result.report.impressionsChange.toFixed(1)}%`);

    // Send email
    const args = process.argv.slice(2);
    if (!args.includes('--no-email')) {
      console.log('\n📬 Sending email report...');
      
      const reportData = {
        weekStartDate: result.report.weekStartDate,
        weekEndDate: result.report.weekEndDate,
        currentMetrics: result.currentMetrics,
        previousMetrics: result.previousMetrics,
        clicksChange: result.report.clicksChange,
        impressionsChange: result.report.impressionsChange,
        ctrChange: result.report.ctrChange,
        positionChange: result.report.positionChange,
        topPages: result.topPages,
        topQueries: result.topQueries,
        insights: result.insights,
        recommendations: result.recommendations,
      };

      await sendWeeklyReport(reportData);

      // Mark report as sent
      await prisma.weeklyReport.update({
        where: { id: result.report.id },
        data: { sentAt: new Date() },
      });

      console.log('✅ Email sent successfully!');
    } else {
      console.log('\n⏭️  Skipping email (--no-email flag)');
    }

    console.log('\n✅ Report generation complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error generating report:', error);
    process.exit(1);
  }
}

main();

