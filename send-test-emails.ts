#!/usr/bin/env tsx
/**
 * Send Test Emails Now
 * 
 * Sends both employee and client test emails immediately
 */

import * as dotenv from 'dotenv';
dotenv.config();

async function sendEmployeeEmail() {
  console.log('\n📬 Sending Employee Weekly Email...');
  
  try {
    const { sendEmployeeWeeklySummary } = await import('./src/services/employee-email-service');
    
    const employeeEmails = process.env.EMPLOYEE_EMAILS || 'chris@stuchai.com';
    
    const recipients: Array<{ name: string; email: string }> = employeeEmails
      .split(',')
      .map(entry => entry.trim())
      .map(entry => {
        const match = entry.match(/^(.*?)\s*<(.+?)>$/);
        if (match) {
          return { name: match[1].trim(), email: match[2].trim() };
        }
        return { name: entry, email: entry };
      });

    console.log(`Recipients: ${recipients.map(r => `${r.name} <${r.email}>`).join(', ')}`);
    
    const result = await sendEmployeeWeeklySummary(recipients);
    
    console.log(`✅ Employee email sent successfully!`);
    console.log(`   Tasks: ${result?.taskCount || 0}`);
    console.log(`   Sent to: ${recipients.map(r => r.email).join(', ')}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send employee email:', error);
    return false;
  }
}

async function sendClientReport() {
  console.log('\n📧 Sending Client Report (BerganCo)...');
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Find BerganCo site
    const site = await prisma.site.findFirst({
      where: { 
        OR: [
          { domain: { contains: 'berganco', mode: 'insensitive' } },
          { isActive: true }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
    
    if (!site) {
      console.error('❌ No sites found');
      await prisma.$disconnect();
      return false;
    }
    
    console.log(`Site: ${site.displayName} (${site.domain})`);
    
    const { generateReport } = await import('./src/services/report-generator');
    const result = await generateReport(undefined, undefined, 'week', site.id);
    
    const reportData = {
      weekStartDate: result.report.weekStartDate,
      weekEndDate: result.report.weekEndDate,
      periodType: 'week' as const,
      currentMetrics: result.currentMetrics,
      previousMetrics: result.previousMetrics,
      clicksChange: result.report.clicksChange,
      impressionsChange: result.report.impressionsChange,
      ctrChange: result.report.ctrChange,
      positionChange: result.report.positionChange,
      monthlyCurrentMetrics: result.monthlyCurrentMetrics,
      monthlyPreviousMetrics: result.monthlyPreviousMetrics,
      monthlyClicksChange: result.monthlyComparison?.clicksChange,
      monthlyImpressionsChange: result.monthlyComparison?.impressionsChange,
      monthlyCtrChange: result.monthlyComparison?.ctrChange,
      monthlyPositionChange: result.monthlyComparison?.positionChange,
      topPages: result.topPages,
      topQueries: result.topQueries,
      insights: result.insights,
      recommendations: result.recommendations,
      aiSummary: result.aiInsights ? {
        executiveSummary: result.aiInsights.executiveSummary,
        wins: result.aiInsights.wins,
        awareness: result.aiInsights.awareness,
        nextSteps: result.aiInsights.nextSteps,
      } : undefined,
      trendsData: result.trendsData,
      websiteDomain: site.domain,
    };
    
    // Send to chris@stuchai.com (override recipient for testing)
    const originalEmailTo = process.env.REPORT_EMAIL_TO;
    process.env.REPORT_EMAIL_TO = 'chris@stuchai.com';
    
    const { sendWeeklyReport } = await import('./src/services/email-service');
    await sendWeeklyReport(reportData);
    
    // Restore original
    process.env.REPORT_EMAIL_TO = originalEmailTo;
    
    console.log(`✅ Client report sent successfully!`);
    console.log(`   Sent to: chris@stuchai.com`);
    console.log(`   Clicks: ${result.currentMetrics.totalClicks}`);
    console.log(`   Impressions: ${result.currentMetrics.totalImpressions}`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Failed to send client report:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Sending Test Emails\n');
  console.log('='.repeat(50));
  
  const employeeSuccess = await sendEmployeeEmail();
  const clientSuccess = await sendClientReport();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Results:');
  console.log(`   Employee Email: ${employeeSuccess ? '✅ Sent' : '❌ Failed'}`);
  console.log(`   Client Report:  ${clientSuccess ? '✅ Sent' : '❌ Failed'}`);
  console.log('\n📬 Check your inbox at chris@stuchai.com!\n');
  
  process.exit(employeeSuccess && clientSuccess ? 0 : 1);
}

main();
