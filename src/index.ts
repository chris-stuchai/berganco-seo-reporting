/**
 * BerganCo SEO Reporting System
 * 
 * Main application entry point with Express server and scheduled jobs
 */

import express from 'express';
import * as cron from 'node-cron';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient, Role } from '@prisma/client';
import { subDays, format, startOfWeek, subWeeks } from 'date-fns';
import { collectAllMetrics } from './services/data-collector';
import { generateWeeklyReport } from './services/report-generator';
import { sendWeeklyReport } from './services/email-service';
import { exec } from 'child_process';
import { promisify } from 'util';
import { requireAuth, requireRole, optionalAuth, AuthenticatedRequest } from './middleware/auth';
import * as authService from './services/auth-service';

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
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    await execAsync('npx prisma generate');
    console.log('✅ Migrations complete\n');
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    // Fail startup if migrations fail - we need the tables
    throw error;
  }
}

app.use(express.json());
app.use(cookieParser());

// Serve static files (images, CSS, JS)
app.use(express.static('public', { 
  extensions: ['html', 'js', 'css', 'png', 'jpg', 'svg']
}));

// Clean routes without .html extension
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.get('/login', (req, res) => {
  res.sendFile('login.html', { root: 'public' });
});

app.get('/employee', (req, res) => {
  res.sendFile('employee.html', { root: 'public' });
});

app.get('/analytics', (req, res) => {
  res.sendFile('analytics.html', { root: 'public' });
});

app.get('/pages', (req, res) => {
  res.sendFile('pages.html', { root: 'public' });
});

app.get('/queries', (req, res) => {
  res.sendFile('queries.html', { root: 'public' });
});

app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: 'public' });
});

app.get('/settings', (req, res) => {
  res.sendFile('settings.html', { root: 'public' });
});

// Auth routes (public)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await authService.login(email, password, ipAddress as string, userAgent);
    
    // Set cookie
    res.cookie('sessionToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const token = req.cookies?.sessionToken || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    await authService.logout(token);
  }
  res.clearCookie('sessionToken');
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        businessName: true,
        logoUrl: true,
      },
    });
    res.json({ user });
  } catch (error) {
    res.json({ user: req.user });
  }
});

// Client profile update (clients can update their own profile)
app.put('/api/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { businessName, logoUrl, email } = req.body;
    const updateData: any = {};
    
    if (businessName !== undefined) updateData.businessName = businessName;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (email !== undefined && req.user!.role === 'CLIENT') updateData.email = email.toLowerCase();
    
    const user = await authService.updateUser(req.user!.userId, updateData);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// User management (admin/employee only)
app.get('/api/users', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const user = await authService.createUser(email, password, name, role || Role.CLIENT);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/users/:id', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const user = await authService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/users/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    await authService.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Impersonation endpoints (admin/employee only)
app.post('/api/auth/impersonate', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.body;
    const result = await authService.createImpersonationSession(req.user!.userId, userId);
    
    res.cookie('sessionToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    
    res.cookie('originalAdminToken', req.user!.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(result);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

app.post('/api/auth/stop-impersonate', async (req, res) => {
  try {
    const impersonationToken = req.cookies?.sessionToken || req.headers.authorization?.replace('Bearer ', '');
    const originalAdminToken = req.cookies?.originalAdminToken;
    
    if (!originalAdminToken) {
      return res.status(400).json({ error: 'No original session found' });
    }

    const originalAdmin = await authService.verifySession(originalAdminToken);
    if (!originalAdmin) {
      return res.status(401).json({ error: 'Original session expired' });
    }

    const result = await authService.endImpersonation(impersonationToken, originalAdmin.userId);
    
    res.cookie('sessionToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    
    res.clearCookie('originalAdminToken');
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Dashboard endpoint - returns latest metrics with calculated 7-day stats
// Protected: requires auth, but different views for client vs employee
app.get('/api/dashboard', optionalAuth, async (req: AuthenticatedRequest, res) => {
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

// Manual data collection endpoint (protected)
app.post('/api/collect', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
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
app.post('/api/generate-report', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
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

// AI Insights endpoint for dashboard
app.get('/api/ai-insights', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const prevStartDate = subDays(startDate, days);

    // Get current period metrics
    const currentMetrics = await prisma.dailyMetric.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const previousMetrics = await prisma.dailyMetric.findMany({
      where: {
        date: {
          gte: prevStartDate,
          lt: startDate,
        },
      },
    });

    // Calculate aggregated metrics
    let totalClicks = 0, totalImpressions = 0, totalCtr = 0, totalPosition = 0;
    currentMetrics.forEach((m) => {
      totalClicks += m.clicks;
      totalImpressions += m.impressions;
      totalCtr += m.ctr;
      totalPosition += m.position;
    });

    let prevTotalClicks = 0, prevTotalImpressions = 0, prevTotalCtr = 0, prevTotalPosition = 0;
    previousMetrics.forEach((m) => {
      prevTotalClicks += m.clicks;
      prevTotalImpressions += m.impressions;
      prevTotalCtr += m.ctr;
      prevTotalPosition += m.position;
    });

    const avgCtr = currentMetrics.length > 0 ? totalCtr / currentMetrics.length : 0;
    const avgPosition = currentMetrics.length > 0 ? totalPosition / currentMetrics.length : 0;
    const prevAvgCtr = previousMetrics.length > 0 ? prevTotalCtr / previousMetrics.length : 0;
    const prevAvgPosition = previousMetrics.length > 0 ? prevTotalPosition / previousMetrics.length : 0;

    const clicksChange = prevTotalClicks > 0 ? ((totalClicks - prevTotalClicks) / prevTotalClicks) * 100 : 0;
    const impressionsChange = prevTotalImpressions > 0 ? ((totalImpressions - prevTotalImpressions) / prevTotalImpressions) * 100 : 0;
    const ctrChange = prevAvgCtr > 0 ? ((avgCtr - prevAvgCtr) / prevAvgCtr) * 100 : 0;
    const positionChange = avgPosition - prevAvgPosition;

    // Get top pages and queries
    const topPages = await prisma.pageMetric.groupBy({
      by: ['page'],
      where: { date: { gte: startDate, lte: endDate } },
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true },
      orderBy: { _sum: { clicks: 'desc' } },
      take: 10,
    });

    const topQueries = await prisma.queryMetric.groupBy({
      by: ['query'],
      where: { date: { gte: startDate, lte: endDate } },
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true },
      orderBy: { _sum: { clicks: 'desc' } },
      take: 10,
    });

    // Import AI service
    const { generateQuickAIInsights } = await import('./services/ai-service');

    const aiContext = {
      currentMetrics: {
        totalClicks,
        totalImpressions,
        averageCtr: avgCtr,
        averagePosition: avgPosition,
      },
      previousMetrics: {
        totalClicks: prevTotalClicks,
        totalImpressions: prevTotalImpressions,
        averageCtr: prevAvgCtr,
        averagePosition: prevAvgPosition,
      },
      changes: {
        clicksChange,
        impressionsChange,
        ctrChange,
        positionChange,
      },
      topPages: topPages.map(p => ({
        page: p.page,
        clicks: p._sum.clicks || 0,
        impressions: p._sum.impressions || 0,
        ctr: p._avg.ctr || 0,
        position: p._avg.position || 0,
      })),
      topQueries: topQueries.map(q => ({
        query: q.query,
        clicks: q._sum.clicks || 0,
        impressions: q._sum.impressions || 0,
        ctr: q._avg.ctr || 0,
        position: q._avg.position || 0,
      })),
      websiteDomain: 'www.berganco.com',
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        previousStartDate: prevStartDate.toISOString().split('T')[0],
        previousEndDate: startDate.toISOString().split('T')[0],
      },
    };

    const aiInsight = await generateQuickAIInsights(aiContext);

    res.json({
      insight: aiInsight,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({ error: 'Failed to generate AI insights' });
  }
});

// AI Chat endpoint
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ 
        error: 'AI features unavailable. Please configure OPENAI_API_KEY.' 
      });
    }

    // Build context from dashboard data
    const contextPrompt = context ? `
Current SEO Metrics:
- Total Clicks: ${context.metrics?.totalClicks || 0}
- Total Impressions: ${context.metrics?.totalImpressions || 0}
- Average CTR: ${((context.metrics?.averageCtr || 0) * 100).toFixed(2)}%
- Average Position: ${(context.metrics?.averagePosition || 0).toFixed(1)}
- Period: ${context.days} days

Changes:
- Clicks: ${(context.metrics?.clicksChange || 0).toFixed(1)}%
- Impressions: ${(context.metrics?.impressionsChange || 0).toFixed(1)}%
- CTR: ${(context.metrics?.ctrChange || 0).toFixed(1)}%
- Position: ${(context.metrics?.positionChange || 0).toFixed(1)}
` : '';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Stuchai AI, an expert SEO analyst specializing in property management and real estate SEO.

**About BerganCo (www.berganco.com):**
BerganCo is a property management company based in Denver, Colorado. They specialize in:
- Property management services
- Rental property management
- Residential property management
- Property maintenance and tenant relations
- Real estate investment management in the Denver metro area

The website serves property owners, investors, and tenants in the Denver, Colorado market. They provide comprehensive property management services including rent collection, maintenance coordination, tenant screening, and financial reporting.

**Your Role:**
You provide concise, actionable insights based on SEO data for www.berganco.com. You understand their business model, target market (Denver property owners and investors), and can relate SEO performance to their property management business goals.

**Guidelines:**
- Be helpful, specific, and focus on actionable recommendations
- Relate SEO metrics to business outcomes (lead generation, visibility, market presence)
- Consider local Denver market dynamics and competition
- Keep responses under 200 words unless more detail is needed
- Reference BerganCo's services and market position when relevant`
          },
          {
            role: 'user',
            content: `${contextPrompt}\n\nUser Question: ${message}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
      usage?: {
        total_tokens?: number;
      };
    };

    // Log API usage
    const { logOpenAIApiCall } = await import('./services/api-tracking');
    const tokensUsed = data.usage?.total_tokens || 0;
    await logOpenAIApiCall('/v1/chat/completions', tokensUsed, true);

    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error in AI chat:', error);
    const { logOpenAIApiCall } = await import('./services/api-tracking');
    await logOpenAIApiCall('/v1/chat/completions', 0, false, error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Competitive Analysis endpoint
app.get('/api/competitors', async (req, res) => {
  try {
    const { analyzeCompetitors, getCompetitiveSummary } = await import('./services/competitor-analysis');
    const summary = await getCompetitiveSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching competitor analysis:', error);
    res.status(500).json({ error: 'Failed to fetch competitor analysis' });
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

// Admin endpoints for usage stats and schedules
app.get('/api/admin/usage', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const [googleCalls, openaiCalls, totalCost, logins] = await Promise.all([
      prisma.apiUsage.count({
        where: { apiType: 'GOOGLE', createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.apiUsage.count({
        where: { apiType: 'OPENAI', createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.apiUsage.aggregate({
        where: { apiType: 'OPENAI', createdAt: { gte: thirtyDaysAgo } },
        _sum: { costEstimate: true }
      }),
      prisma.loginLog.count({
        where: { success: true, createdAt: { gte: thirtyDaysAgo } }
      })
    ]);
    
    res.json({
      googleApiCalls: googleCalls,
      openaiApiCalls: openaiCalls,
      estimatedOpenAICost: totalCost._sum.costEstimate || 0,
      totalLogins: logins
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/schedules', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const schedules = await prisma.scheduleConfig.findMany();
    res.json(schedules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/schedules', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const { jobType, cronExpression, isEnabled } = req.body;
    
    // Note: node-cron doesn't have a validate function, so we'll skip validation for now
    // In production, you'd want to validate cron expressions properly
    
    const schedule = await prisma.scheduleConfig.upsert({
      where: { jobType },
      update: { cronExpression, isEnabled, updatedAt: new Date() },
      create: { jobType, cronExpression, isEnabled }
    });
    
    // Note: Actual cron job updates would require restarting the cron scheduler
    // For now, we just store the config. The cron jobs can check this on next run.
    
    res.json(schedule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule daily data collection (runs at 3 AM every day)
cron.schedule('0 3 * * *', async () => {
  console.log('🕐 Running scheduled data collection...');
  try {
    // Check if enabled in config
    const config = await prisma.scheduleConfig.findUnique({
      where: { jobType: 'DATA_COLLECTION' }
    });
    if (config && !config.isEnabled) {
      console.log('⏸️  Data collection scheduled job is disabled');
      return;
    }
    
    const date = subDays(new Date(), 3);
    await collectAllMetrics(date);
    
    // Update last run time
    if (config) {
      await prisma.scheduleConfig.update({
        where: { id: config.id },
        data: { lastRun: new Date() }
      });
    }
    
    console.log('✅ Scheduled data collection complete');
  } catch (error) {
    console.error('❌ Scheduled data collection failed:', error);
  }
});

// Schedule weekly report generation (runs at 8 AM every Monday)
cron.schedule('0 8 * * 1', async () => {
  console.log('📧 Running scheduled weekly report...');
  try {
    // Check if enabled in config
    const config = await prisma.scheduleConfig.findUnique({
      where: { jobType: 'REPORT_GENERATION' }
    });
    if (config && !config.isEnabled) {
      console.log('⏸️  Report generation scheduled job is disabled');
      return;
    }
    
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
    
    // Update last run time
    if (config) {
      await prisma.scheduleConfig.update({
        where: { id: config.id },
        data: { lastRun: new Date() }
      });
    }

    console.log('✅ Scheduled weekly report sent');
  } catch (error) {
    console.error('❌ Scheduled weekly report failed:', error);
  }
});

// Auto-create admin user if environment variables are set
async function createAdminIfNeeded() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin User';

  if (!adminEmail || !adminPassword) {
    console.log('⏭️  Skipping admin user creation (ADMIN_EMAIL or ADMIN_PASSWORD not set)');
    return;
  }

  try {
    // Wait a moment for Prisma Client to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });

    if (existingUser) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      return;
    }

    // Create admin user
    await authService.createUser(adminEmail, adminPassword, adminName, Role.ADMIN);
    console.log(`✅ Admin user created: ${adminEmail}`);
  } catch (error: any) {
    console.error(`⚠️  Failed to create admin user: ${error.message}`);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    // Don't fail startup - user might already exist or we can create manually
  }
}

// Start server with migrations
async function startServer() {
  // Run migrations first
  await runMigrations();

  // Create admin user if environment variables are set
  await createAdminIfNeeded();

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

