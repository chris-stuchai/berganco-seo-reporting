/**
 * BerganCo SEO Reporting System
 * 
 * Main application entry point with Express server and scheduled jobs
 */

import express from 'express';
import * as cron from 'node-cron';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { subDays, format, startOfWeek, subWeeks } from 'date-fns';
import { collectAllMetrics } from './services/data-collector';
import { generateWeeklyReport } from './services/report-generator';
import { sendWeeklyReport } from './services/email-service';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const execAsync = promisify(exec);

// Run migrations on startup
async function runMigrations() {
  if (process.env.SKIP_MIGRATIONS === 'true') {
    console.log('⏭️  Skipping migrations (SKIP_MIGRATIONS=true)');
    return;
  }

  console.log('\n🗄️  Running database migrations...');
  try {
    await execAsync('npx prisma migrate deploy');
    await execAsync('npx prisma generate');
    console.log('✅ Migrations complete\n');
  } catch (error: any) {
    console.error('⚠️  Migration warning:', error.message);
    // Don't fail startup if migrations fail - might be schema already up to date
    console.log('⏭️  Continuing startup...\n');
  }
}

app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Dashboard endpoint - returns latest metrics with calculated 7-day stats
app.get('/api/dashboard', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Get daily metrics for the date range
    const dailyMetrics = await prisma.dailyMetric.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate aggregated metrics for the period
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalCtr = 0;
    let totalPosition = 0;
    let metricCount = 0;

    dailyMetrics.forEach((metric) => {
      totalClicks += metric.clicks;
      totalImpressions += metric.impressions;
      totalCtr += metric.ctr;
      totalPosition += metric.position;
      metricCount++;
    });

    const avgCtr = metricCount > 0 ? totalCtr / metricCount : 0;
    const avgPosition = metricCount > 0 ? totalPosition / metricCount : 0;

    // Get previous period for comparison
    const prevStartDate = subDays(startDate, days);
    const prevDailyMetrics = await prisma.dailyMetric.findMany({
      where: {
        date: {
          gte: prevStartDate,
          lt: startDate,
        },
      },
    });

    let prevTotalClicks = 0;
    let prevTotalImpressions = 0;
    let prevMetricCount = 0;

    prevDailyMetrics.forEach((metric) => {
      prevTotalClicks += metric.clicks;
      prevTotalImpressions += metric.impressions;
      prevMetricCount++;
    });

    const prevAvgCtr = prevMetricCount > 0 
      ? prevDailyMetrics.reduce((sum, m) => sum + m.ctr, 0) / prevMetricCount 
      : 0;
    const prevAvgPosition = prevMetricCount > 0
      ? prevDailyMetrics.reduce((sum, m) => sum + m.position, 0) / prevMetricCount
      : 0;

    // Calculate changes
    const clicksChange = prevTotalClicks > 0
      ? ((totalClicks - prevTotalClicks) / prevTotalClicks) * 100
      : 0;
    const impressionsChange = prevTotalImpressions > 0
      ? ((totalImpressions - prevTotalImpressions) / prevTotalImpressions) * 100
      : 0;
    const ctrChange = prevAvgCtr > 0
      ? ((avgCtr - prevAvgCtr) / prevAvgCtr) * 100
      : 0;
    const positionChange = avgPosition - prevAvgPosition;

    const latestReport = await prisma.weeklyReport.findFirst({
      orderBy: { weekStartDate: 'desc' },
    });

    // Return calculated metrics
    res.json({
      period: {
        days,
        startDate: startDate,
        endDate: endDate,
      },
      metrics: {
        totalClicks,
        totalImpressions,
        averageCtr: avgCtr,
        averagePosition: avgPosition,
        clicksChange,
        impressionsChange,
        ctrChange,
        positionChange,
        dataPoints: metricCount,
      },
      latestMetrics: dailyMetrics,
      latestReport,
      lastUpdate: dailyMetrics[0]?.date || null,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Manual data collection endpoint
app.post('/api/collect', async (req, res) => {
  try {
    const date = subDays(new Date(), 3);
    await collectAllMetrics(date);
    res.json({ success: true, date: format(date, 'yyyy-MM-dd') });
  } catch (error) {
    console.error('Error collecting data:', error);
    res.status(500).json({ error: 'Failed to collect data' });
  }
});

// Manual report generation endpoint
app.post('/api/generate-report', async (req, res) => {
  try {
    const result = await generateWeeklyReport();
    
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

    await prisma.weeklyReport.update({
      where: { id: result.report.id },
      data: { sentAt: new Date() },
    });

    res.json({ success: true, reportId: result.report.id });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get historical trends
app.get('/api/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    const metrics = await prisma.dailyMetric.findMany({
      where: {
        date: {
          gte: subDays(new Date(), days),
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Get top pages
app.get('/api/top-pages', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const pages = await prisma.pageMetric.groupBy({
      by: ['page'],
      where: {
        date: {
          gte: subDays(new Date(), days),
        },
      },
      _sum: {
        clicks: true,
        impressions: true,
      },
      _avg: {
        ctr: true,
        position: true,
      },
      orderBy: {
        _sum: {
          clicks: 'desc',
        },
      },
      take: limit,
    });

    res.json(pages);
  } catch (error) {
    console.error('Error fetching top pages:', error);
    res.status(500).json({ error: 'Failed to fetch top pages' });
  }
});

// Get top queries
app.get('/api/top-queries', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const queries = await prisma.queryMetric.groupBy({
      by: ['query'],
      where: {
        date: {
          gte: subDays(new Date(), days),
        },
      },
      _sum: {
        clicks: true,
        impressions: true,
      },
      _avg: {
        ctr: true,
        position: true,
      },
      orderBy: {
        _sum: {
          clicks: 'desc',
        },
      },
      take: limit,
    });

    res.json(queries);
  } catch (error) {
    console.error('Error fetching top queries:', error);
    res.status(500).json({ error: 'Failed to fetch top queries' });
  }
});

// Admin: Get system status
app.get('/api/admin/status', async (req, res) => {
  try {
    const latestMetric = await prisma.dailyMetric.findFirst({
      orderBy: { date: 'desc' },
    });

    const latestReport = await prisma.weeklyReport.findFirst({
      orderBy: { weekStartDate: 'desc' },
    });

    const totalMetrics = await prisma.dailyMetric.count();
    const totalPages = await prisma.pageMetric.count();
    const totalQueries = await prisma.queryMetric.count();
    const totalReports = await prisma.weeklyReport.count();

    res.json({
      database: {
        connected: true,
        totalMetrics,
        totalPages,
        totalQueries,
        totalReports,
      },
      lastDataCollection: latestMetric?.date || null,
      lastReport: latestReport?.weekStartDate || null,
      lastReportSent: latestReport?.sentAt || null,
      automation: {
        dailyCollection: {
          enabled: true,
          schedule: 'Daily at 3:00 AM',
          nextRun: 'Calculated based on current time',
        },
        weeklyReports: {
          enabled: true,
          schedule: 'Monday at 8:00 AM',
          nextRun: 'Calculated based on current time',
        },
      },
      system: {
        version: '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    console.error('Error fetching admin status:', error);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
});

// Admin: Get all reports history
app.get('/api/admin/reports', async (req, res) => {
  try {
    const reports = await prisma.weeklyReport.findMany({
      orderBy: { weekStartDate: 'desc' },
      take: 50,
    });

    res.json(reports.map(r => ({
      id: r.id,
      weekStartDate: r.weekStartDate,
      weekEndDate: r.weekEndDate,
      totalClicks: r.totalClicks,
      clicksChange: r.clicksChange,
      sentAt: r.sentAt,
      createdAt: r.createdAt,
    })));
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Admin: Backfill data with date range
app.post('/api/admin/backfill', async (req, res) => {
  try {
    const { days } = req.body;
    const daysToBackfill = parseInt(days) || 30;

    // Start backfill in background
    (async () => {
      try {
        const { backfillMetrics } = await import('./services/data-collector');
        await backfillMetrics(daysToBackfill);
        console.log(`✅ Admin backfill complete: ${daysToBackfill} days`);
      } catch (error) {
        console.error('❌ Admin backfill failed:', error);
      }
    })();

    res.json({ 
      success: true, 
      message: `Backfilling ${daysToBackfill} days of data...`,
      status: 'running',
    });
  } catch (error) {
    console.error('Error starting backfill:', error);
    res.status(500).json({ error: 'Failed to start backfill' });
  }
});

// Schedule daily data collection (runs at 3 AM every day)
cron.schedule('0 3 * * *', async () => {
  console.log('🕐 Running scheduled data collection...');
  try {
    const date = subDays(new Date(), 3);
    await collectAllMetrics(date);
    console.log('✅ Scheduled data collection complete');
  } catch (error) {
    console.error('❌ Scheduled data collection failed:', error);
  }
});

// Schedule weekly report generation (runs at 8 AM every Monday)
cron.schedule('0 8 * * 1', async () => {
  console.log('📧 Running scheduled weekly report...');
  try {
    const result = await generateWeeklyReport();
    
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

    await prisma.weeklyReport.update({
      where: { id: result.report.id },
      data: { sentAt: new Date() },
    });

    console.log('✅ Scheduled weekly report sent');
  } catch (error) {
    console.error('❌ Scheduled weekly report failed:', error);
  }
});

// Start server with migrations
async function startServer() {
  // Run migrations first
  await runMigrations();

  // Start the server
  app.listen(PORT, () => {
    console.log(`\n🚀 BerganCo SEO Reporting System`);
    console.log(`📊 Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Dashboard API: http://localhost:${PORT}/api/dashboard`);
    console.log(`\n⏰ Scheduled jobs:`);
    console.log(`   - Data collection: Daily at 3:00 AM`);
    console.log(`   - Weekly reports: Mondays at 8:00 AM\n`);
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

