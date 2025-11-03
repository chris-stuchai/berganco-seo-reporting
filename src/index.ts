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
import * as siteService from './services/site-service';
import { getUserAccessibleSiteIds } from './utils/site-access';

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
    const { email, password, name, role, businessName, logoUrl, sendOnboardingEmail: sendEmail } = req.body;
    const user = await authService.createUser(email, password, name, role || Role.CLIENT, businessName, logoUrl);
    
    // Send onboarding email if requested
    let emailSent = false;
    if (sendEmail) {
      try {
        const { sendOnboardingEmail } = await import('./services/email-service');
        const loginUrl = process.env.APP_URL || (req.headers.origin || 'http://localhost:3000');
        await sendOnboardingEmail(user.name, user.email, password, `${loginUrl}/login`);
        emailSent = true;
        console.log(`✓ Onboarding email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send onboarding email:', emailError);
        // Don't fail user creation if email fails
        emailSent = false;
      }
    }
    
    res.json({ ...user, emailSent });
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

// Site Management & Onboarding Endpoints (Admin/Employee only)
app.get('/api/sites', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const sites = await siteService.getAllSites();
    res.json(sites);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sites', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const { domain, displayName, googleSiteUrl, ownerId } = req.body;
    
    if (!domain || !displayName || !ownerId) {
      return res.status(400).json({ error: 'domain, displayName, and ownerId are required' });
    }

    const site = await siteService.createSite({
      domain,
      displayName,
      googleSiteUrl: googleSiteUrl || `https://${domain}`,
      ownerId,
    });

    res.json(site);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/sites/:siteId/assign', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const { siteId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const assignment = await siteService.assignSiteToClient(siteId, userId);
    res.json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/sites/:siteId/assign/:userId', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const { siteId, userId } = req.params;
    await siteService.unassignSiteFromClient(siteId, userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update site endpoint
app.put('/api/sites/:siteId', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const { siteId } = req.params;
    const { displayName, googleSiteUrl, domain } = req.body;
    
    // Validate googleSiteUrl if provided
    if (googleSiteUrl) {
      try {
        new URL(googleSiteUrl);
      } catch {
        return res.status(400).json({ error: 'Invalid Google Site URL format. Must be a valid URL (e.g., https://www.example.com)' });
      }
    }
    
    const updates: any = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (googleSiteUrl !== undefined) updates.googleSiteUrl = googleSiteUrl;
    if (domain !== undefined) updates.domain = domain;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const updatedSite = await siteService.updateSite(siteId, updates);
    
    res.json(updatedSite);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sites/my-sites', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const sites = await siteService.getUserSites(req.user!.userId);
    res.json(sites);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sites/my-primary', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const site = await siteService.getUserPrimarySite(req.user!.userId);
    res.json(site);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard endpoint - returns latest metrics with calculated 7-day stats
// Protected: requires auth, but different views for client vs employee
app.get('/api/dashboard', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    // Google Search Console has a 2-3 day delay - use 3 days ago as end date for complete data
    const endDate = subDays(new Date(), 3);
    // Calculate start date to get exactly 'days' days of data (endDate inclusive)
    const startDate = subDays(endDate, days - 1);

    // Get user's accessible site IDs (if authenticated)
    let accessibleSiteIds: string[] = [];
    if (req.user) {
      const { getUserAccessibleSiteIds } = await import('./utils/site-access');
      accessibleSiteIds = await getUserAccessibleSiteIds(req.user.userId);
    } else {
      // For unauthenticated requests, get all active sites (public view)
      const allSites = await prisma.site.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      accessibleSiteIds = allSites.map(s => s.id);
    }

    // If no sites accessible, return empty data
    if (accessibleSiteIds.length === 0) {
      return res.json({
        period: { days, startDate, endDate },
        metrics: {
          totalClicks: 0,
          totalImpressions: 0,
          averageCtr: 0,
          averagePosition: 0,
          clicksChange: 0,
          impressionsChange: 0,
          ctrChange: 0,
          positionChange: 0,
          dataPoints: 0,
          expectedDataPoints: days,
          dataCoverage: 0,
        },
        latestMetrics: [],
        latestReport: null,
        lastUpdate: null,
        diagnostics: {
          missingDays: days,
          oldestDate: null,
          newestDate: null,
        },
      });
    }

    // Get daily metrics for the date range, filtered by accessible sites
    const dailyMetrics = await prisma.dailyMetric.findMany({
      where: {
        siteId: { in: accessibleSiteIds },
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
    
    // Count unique dates across all accessible sites (not just record count)
    // This ensures we accurately detect missing dates
    const uniqueDates = new Set<string>();
    
    dailyMetrics.forEach((metric) => {
      totalClicks += metric.clicks;
      totalImpressions += metric.impressions;
      totalCtr += metric.ctr;
      totalPosition += metric.position;
      uniqueDates.add(format(metric.date, 'yyyy-MM-dd'));
    });
    
    const metricCount = uniqueDates.size;

    const avgCtr = metricCount > 0 ? totalCtr / metricCount : 0;
    const avgPosition = metricCount > 0 ? totalPosition / metricCount : 0;

    // Get previous period for comparison (same duration, ending just before startDate)
    const prevEndDate = subDays(startDate, 1);
    const prevStartDate = subDays(prevEndDate, days - 1);
    const [prevDailyMetrics, latestReport] = await Promise.all([
      prisma.dailyMetric.findMany({
        where: {
          siteId: { in: accessibleSiteIds },
          date: {
            gte: prevStartDate,
            lte: prevEndDate,
          },
        },
      }),
      prisma.weeklyReport.findFirst({
        where: { siteId: { in: accessibleSiteIds } },
        orderBy: { weekStartDate: 'desc' },
      }),
    ]);

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

    // Return calculated metrics with data coverage info
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
        expectedDataPoints: days, // For diagnostic purposes
        dataCoverage: metricCount > 0 ? (metricCount / days) * 100 : 0, // Percentage of days with data
      },
      latestMetrics: dailyMetrics,
      latestReport,
      lastUpdate: dailyMetrics[0]?.date || null,
      diagnostics: {
        missingDays: days - metricCount,
        oldestDate: dailyMetrics.length > 0 ? dailyMetrics[dailyMetrics.length - 1]?.date : null,
        newestDate: dailyMetrics.length > 0 ? dailyMetrics[0]?.date : null,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Manual data collection endpoint (all authenticated users can sync)
app.post('/api/collect', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { days } = req.body;
    // Use the selected days, but also check up to 90 days back to catch any older missing data
    const selectedDays = days || 7; // Default to 7 days if not specified
    const maxCheckDays = Math.max(selectedDays, 90); // Always check at least 90 days to catch any missing data
    
    // Calculate date range (respecting GSC 2-3 day delay)
    const endDate = subDays(new Date(), 3); // GSC data available up to 3 days ago
    // Check for missing days in the requested range, but also extend to catch any older missing data
    const startDate = subDays(endDate, maxCheckDays - 1);
    
    // Get all active sites first
    const activeSites = await prisma.site.findMany({
      where: { isActive: true },
    });
    
    if (activeSites.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No active sites found. Please create a site first.' 
      });
    }
    
    // Check which days are missing per-site (a date is missing if ANY site doesn't have data for it)
    const siteIds = activeSites.map(s => s.id);
    // Query for the extended range (90 days) to find all existing metrics
    const extendedStartDate = subDays(endDate, maxCheckDays - 1);
    const existingMetrics = await prisma.dailyMetric.findMany({
      where: {
        siteId: { in: siteIds },
        date: {
          gte: extendedStartDate,
          lte: endDate,
        },
      },
      select: {
        siteId: true,
        date: true,
      },
    });
    
    // Create a map of date -> set of siteIds that have data for that date
    const dateSiteMap = new Map<string, Set<string>>();
    for (const metric of existingMetrics) {
      const dateStr = format(metric.date, 'yyyy-MM-dd');
      if (!dateSiteMap.has(dateStr)) {
        dateSiteMap.set(dateStr, new Set());
      }
      dateSiteMap.get(dateStr)!.add(metric.siteId);
    }
    
    // Find missing days - a date is missing if not all active sites have data for it
    // Check all dates in the extended range (up to 90 days) to catch any missing data
    const missingDates: Date[] = [];
    for (let i = 3; i < maxCheckDays + 3; i++) {
      const checkDate = subDays(new Date(), i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const sitesWithData = dateSiteMap.get(dateStr);
      
      // If the date doesn't exist in the map, or not all sites have data, it's missing
      if (!sitesWithData || sitesWithData.size < siteIds.length) {
        missingDates.push(checkDate);
      }
    }
    
    // If we extended beyond the selected range, filter to only show dates within selected range in response
    // But still collect all missing dates in the background
    const missingDatesInRange = missingDates.filter(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const rangeStart = subDays(endDate, selectedDays - 1);
      return date >= rangeStart && date <= endDate;
    });
    
    if (missingDates.length === 0) {
      return res.json({ 
        success: true, 
        message: 'All data is already synced for this period',
        synced: 0 
      });
    }
    
    // Log how many days we're syncing (including those beyond the selected range)
    if (missingDates.length > missingDatesInRange.length) {
      console.log(`📊 Found ${missingDates.length} missing days total (${missingDatesInRange.length} in selected ${selectedDays}-day range, ${missingDates.length - missingDatesInRange.length} beyond range)`);
    }

    // Start syncing missing days in background (don't block response)
    (async () => {
      try {
        let syncedCount = 0;
        let failedDates: string[] = [];
        
        for (const date of missingDates) {
          try {
            let siteSuccessCount = 0;
            let siteErrorCount = 0;
            
            // Collect metrics for each active site
            for (const site of activeSites) {
              try {
                // Validate site URL before attempting collection
                if (!site.googleSiteUrl || !site.googleSiteUrl.includes('://')) {
                  console.error(`⚠️  Skipping site ${site.id} (${site.domain}): Invalid Google Site URL: ${site.googleSiteUrl}`);
                  siteErrorCount++;
                  continue;
                }
                await collectAllMetrics(date, site.id, site.googleSiteUrl);
                siteSuccessCount++;
                console.log(`✓ Collected data for ${site.domain} on ${format(date, 'yyyy-MM-dd')}`);
              } catch (siteError) {
                // Log site-specific error but continue with other sites
                console.error(`Error collecting for site ${site.id} (${site.domain}) on ${format(date, 'yyyy-MM-dd')}:`, siteError);
                siteErrorCount++;
              }
            }
            
            // Mark date as successful if at least one site succeeded
            // This ensures we don't mark dates as "failed" if some sites succeed
            if (siteSuccessCount > 0) {
              syncedCount++;
              if (siteErrorCount > 0) {
                console.log(`⚠️  Partially synced ${format(date, 'yyyy-MM-dd')}: ${siteSuccessCount} site(s) succeeded, ${siteErrorCount} failed`);
              } else {
                console.log(`✓ Synced data for ${format(date, 'yyyy-MM-dd')} (${siteSuccessCount} site(s))`);
              }
            } else {
              // Only mark as failed if ALL sites failed
              failedDates.push(format(date, 'yyyy-MM-dd'));
              console.error(`❌ Failed to sync ${format(date, 'yyyy-MM-dd')}: All sites failed`);
            }
          } catch (error) {
            console.error(`Error syncing ${format(date, 'yyyy-MM-dd')}:`, error);
            failedDates.push(format(date, 'yyyy-MM-dd'));
          }
        }
        
        if (failedDates.length > 0) {
          console.log(`⚠️  Sync completed with errors: ${syncedCount}/${missingDates.length} days synced successfully. Failed dates: ${failedDates.join(', ')}`);
        } else {
          console.log(`✅ Sync complete: ${syncedCount}/${missingDates.length} days synced successfully`);
        }
      } catch (error) {
        console.error('Error during sync:', error);
      }
    })();
    
    res.json({ 
      success: true, 
      message: `Syncing ${missingDates.length} missing day${missingDates.length > 1 ? 's' : ''}...`,
      syncing: missingDates.length,
      dates: missingDatesInRange.map(d => format(d, 'yyyy-MM-dd')), // Show only dates in selected range
      totalDates: missingDates.length // But include total count
    });
  } catch (error) {
    console.error('Error collecting data:', error);
    res.status(500).json({ error: 'Failed to collect data' });
  }
});

// Preview email endpoint (generates report but doesn't send)
app.post('/api/preview-report', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, periodType } = req.body;
    
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;
    const reportPeriodType = periodType || 'week';
    
    if (startDate && endDate) {
      parsedStartDate = new Date(startDate);
      parsedEndDate = new Date(endDate);
    }
    
    // Get siteId from request or user's primary site
    let targetSiteId: string | undefined = req.body.siteId;
    
    if (!targetSiteId && req.user) {
      const { getUserAccessibleSiteIds } = await import('./utils/site-access');
      const accessibleSiteIds = await getUserAccessibleSiteIds(req.user.userId);
      if (accessibleSiteIds.length > 0) {
        targetSiteId = accessibleSiteIds[0]; // Use first accessible site
      }
    }

    const { generateReport } = await import('./services/report-generator');
    const result = await generateReport(parsedStartDate, parsedEndDate, reportPeriodType, targetSiteId);
    
    // Get site info for domain
    const site = await prisma.site.findUnique({
      where: { id: result.report.siteId },
      select: { domain: true },
    });
    
    // Fetch tasks for this client/week (filter by users who have access to this site)
    let tasks: any[] = [];
    try {
      // Get all user IDs who have access to this site
      const siteAccess = await prisma.clientSite.findMany({
        where: { siteId: result.report.siteId },
        select: { userId: true },
      });
      const siteOwner = await prisma.site.findUnique({
        where: { id: result.report.siteId },
        select: { ownerId: true },
      });
      const userIds = [siteOwner?.ownerId, ...siteAccess.map(cs => cs.userId)].filter((id): id is string => !!id);
      
      const clientTasks = await prisma.task.findMany({
        where: {
          weekStartDate: result.report.weekStartDate,
          userId: { in: Array.from(userIds) },
          status: { not: 'CANCELLED' },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        take: 10,
      });
      tasks = clientTasks;
    } catch (error) {
      console.warn('Could not fetch tasks for email:', error);
    }
    
    const reportData = {
      weekStartDate: result.report.weekStartDate,
      weekEndDate: result.report.weekEndDate,
      periodType: result.periodType,
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
      aiSummary: result.aiInsights ? {
        executiveSummary: result.aiInsights.executiveSummary,
        wins: result.aiInsights.wins,
        awareness: result.aiInsights.awareness,
        nextSteps: result.aiInsights.nextSteps,
      } : undefined,
      trendsData: result.trendsData,
      websiteDomain: site?.domain || 'unknown',
      tasks: tasks.map((t: any) => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
      })),
    };

    const { getEmailPreview } = await import('./services/email-service');
    const emailHTML = getEmailPreview(reportData);

    res.json({ 
      success: true,
      reportId: result.report.id,
      emailHTML,
      reportData
    });
  } catch (error: any) {
    console.error('Error generating preview:', error);
    const errorMessage = error.message || 'Failed to generate preview';
    res.status(500).json({ 
      error: errorMessage,
      details: error.stack
    });
  }
});

// Manual report generation endpoint
app.post('/api/generate-report', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, periodType } = req.body;
    
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;
    const reportPeriodType = periodType || 'week';
    
    if (startDate && endDate) {
      parsedStartDate = new Date(startDate);
      parsedEndDate = new Date(endDate);
    }
    
    // Get siteId from request or user's primary site
    let targetSiteId: string | undefined = req.body.siteId;
    
    if (!targetSiteId && req.user) {
      const { getUserAccessibleSiteIds } = await import('./utils/site-access');
      const accessibleSiteIds = await getUserAccessibleSiteIds(req.user.userId);
      if (accessibleSiteIds.length > 0) {
        targetSiteId = accessibleSiteIds[0]; // Use first accessible site
      }
    }

    const { generateReport } = await import('./services/report-generator');
    const result = await generateReport(parsedStartDate, parsedEndDate, reportPeriodType, targetSiteId);
    
    // Get site info for domain
    const site = await prisma.site.findUnique({
      where: { id: result.report.siteId },
      select: { domain: true },
    });
    
    // Fetch tasks for this client/week (filter by users who have access to this site)
    let emailTasks: any[] = [];
    try {
      // Get all user IDs who have access to this site
      const siteAccess = await prisma.clientSite.findMany({
        where: { siteId: result.report.siteId },
        select: { userId: true },
      });
      const siteOwner = await prisma.site.findUnique({
        where: { id: result.report.siteId },
        select: { ownerId: true },
      });
      const userIds = [siteOwner?.ownerId, ...siteAccess.map(cs => cs.userId)].filter((id): id is string => !!id);
      
      const clientTasks = await prisma.task.findMany({
        where: {
          weekStartDate: result.report.weekStartDate,
          userId: { in: Array.from(userIds) },
          status: { not: 'CANCELLED' },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        take: 10,
      });
      emailTasks = clientTasks;
    } catch (error) {
      console.warn('Could not fetch tasks for email:', error);
    }
    
    const reportData = {
      weekStartDate: result.report.weekStartDate,
      weekEndDate: result.report.weekEndDate,
      periodType: result.periodType,
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
      aiSummary: result.aiInsights ? {
        executiveSummary: result.aiInsights.executiveSummary,
        wins: result.aiInsights.wins,
        awareness: result.aiInsights.awareness,
        nextSteps: result.aiInsights.nextSteps,
      } : undefined,
      trendsData: result.trendsData,
      websiteDomain: site?.domain || 'unknown',
      tasks: emailTasks.map((t: any) => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
      })),
    };

    // Try to send email, but don't fail if it doesn't work
    let emailSent = false;
    try {
      await sendWeeklyReport(reportData);
      emailSent = true;
    } catch (emailError) {
      console.error('Warning: Failed to send email, but report was generated:', emailError);
      // Report is still generated even if email fails
    }

    await prisma.weeklyReport.update({
      where: { id: result.report.id },
      data: { sentAt: emailSent ? new Date() : null },
    });

    res.json({ 
      success: true, 
      reportId: result.report.id,
      emailSent,
      message: emailSent 
        ? 'Report generated and email sent successfully' 
        : 'Report generated successfully (email failed - check SMTP settings)'
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    const errorMessage = error.message || 'Failed to generate report';
    res.status(500).json({ 
      error: errorMessage,
      details: error.stack // Include stack for debugging in dev
    });
  }
});

// Get historical trends (optional auth - filters by user's sites if authenticated)
app.get('/api/trends', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    // Get user's accessible site IDs
    let accessibleSiteIds: string[] = [];
    if (req.user) {
      const { getUserAccessibleSiteIds } = await import('./utils/site-access');
      accessibleSiteIds = await getUserAccessibleSiteIds(req.user.userId);
    } else {
      // For unauthenticated, get all active sites
      const allSites = await prisma.site.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      accessibleSiteIds = allSites.map(s => s.id);
    }
    
    if (accessibleSiteIds.length === 0) {
      return res.json([]);
    }
    
    // Google Search Console has a 2-3 day delay - use 3 days ago as end date for complete data
    const endDate = subDays(new Date(), 3);
    const startDate = subDays(endDate, days - 1);
    
    const metrics = await prisma.dailyMetric.findMany({
      where: {
        siteId: { in: accessibleSiteIds },
        date: {
          gte: startDate,
          lte: endDate,
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

// Get top pages (optional auth - filters by user's sites if authenticated)
app.get('/api/top-pages', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Get user's accessible site IDs
    let accessibleSiteIds: string[] = [];
    if (req.user) {
      const { getUserAccessibleSiteIds } = await import('./utils/site-access');
      accessibleSiteIds = await getUserAccessibleSiteIds(req.user.userId);
    } else {
      const allSites = await prisma.site.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      accessibleSiteIds = allSites.map(s => s.id);
    }
    
    if (accessibleSiteIds.length === 0) {
      return res.json([]);
    }
    
    // Google Search Console has a 2-3 day delay - use 3 days ago as end date for complete data
    const endDate = subDays(new Date(), 3);
    const startDate = subDays(endDate, days - 1);
    
    const pages = await prisma.pageMetric.groupBy({
      by: ['page'],
      where: {
        siteId: { in: accessibleSiteIds },
        date: {
          gte: startDate,
          lte: endDate,
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
    
    // Google Search Console has a 2-3 day delay - use 3 days ago as end date for complete data
    const endDate = subDays(new Date(), 3);
    const startDate = subDays(endDate, days - 1);
    
    const queries = await prisma.queryMetric.groupBy({
      by: ['query'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
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

// AI Insights endpoint for dashboard (supports multi-tenant)
app.get('/api/ai-insights', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    // Google Search Console has a 2-3 day delay - use 3 days ago as end date for complete data
    const endDate = subDays(new Date(), 3);
    // Calculate start date to get exactly 'days' days of data (endDate inclusive)
    const startDate = subDays(endDate, days - 1);
    // Previous period: same duration, ending just before startDate
    const prevEndDate = subDays(startDate, 1);
    const prevStartDate = subDays(prevEndDate, days - 1);

    // Get user's accessible site IDs
    let accessibleSiteIds: string[] = [];
    let primarySite: { id: string; domain: string; displayName: string | null } | null = null;
    
    if (req.user) {
      const { getUserAccessibleSiteIds } = await import('./utils/site-access');
      accessibleSiteIds = await getUserAccessibleSiteIds(req.user.userId);
      
      // Get primary site (first accessible site) for domain
      if (accessibleSiteIds.length > 0) {
        primarySite = await prisma.site.findFirst({
          where: { id: accessibleSiteIds[0], isActive: true },
          select: { id: true, domain: true, displayName: true },
        });
      }
    } else {
      // For unauthenticated, get first active site
      const allSites = await prisma.site.findMany({
        where: { isActive: true },
        select: { id: true, domain: true, displayName: true },
        take: 1,
      });
      if (allSites.length > 0) {
        primarySite = allSites[0];
        accessibleSiteIds = [primarySite.id];
      }
    }

    if (accessibleSiteIds.length === 0) {
      return res.status(404).json({ error: 'No accessible sites found' });
    }

    // Get current period metrics filtered by site
    const currentMetrics = await prisma.dailyMetric.findMany({
      where: {
        siteId: { in: accessibleSiteIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const previousMetrics = await prisma.dailyMetric.findMany({
      where: {
        siteId: { in: accessibleSiteIds },
        date: {
          gte: prevStartDate,
          lte: prevEndDate,
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

    // Get top pages and queries filtered by site
    const topPages = await prisma.pageMetric.groupBy({
      by: ['page'],
      where: { 
        siteId: { in: accessibleSiteIds },
        date: { gte: startDate, lte: endDate } 
      },
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true },
      orderBy: { _sum: { clicks: 'desc' } },
      take: 10,
    });

    const topQueries = await prisma.queryMetric.groupBy({
      by: ['query'],
      where: { 
        siteId: { in: accessibleSiteIds },
        date: { gte: startDate, lte: endDate } 
      },
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
      websiteDomain: primarySite?.domain || 'unknown',
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

// AI Chat endpoint (supports multi-tenant)
app.post('/api/ai-chat', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { message, context } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ 
        error: 'AI features unavailable. Please configure OPENAI_API_KEY.' 
      });
    }

    // Get user's primary site for context
    let websiteDomain = 'your website';
    let businessName = 'your business';
    let businessContext = '';
    
    if (req.user) {
      const { getUserAccessibleSiteIds } = await import('./utils/site-access');
      const accessibleSiteIds = await getUserAccessibleSiteIds(req.user.userId);
      
      if (accessibleSiteIds.length > 0) {
        const primarySite = await prisma.site.findFirst({
          where: { id: accessibleSiteIds[0], isActive: true },
          select: { domain: true, displayName: true },
        });
        
        if (primarySite) {
          websiteDomain = primarySite.domain;
          businessName = primarySite.displayName || primarySite.domain;
        }
      }
    } else if (context?.websiteDomain) {
      websiteDomain = context.websiteDomain;
    }

    // Build dynamic business context based on domain
    if (websiteDomain.includes('berganco') || websiteDomain.includes('property') || websiteDomain.includes('management')) {
      businessContext = `**About ${businessName} (${websiteDomain}):**
${businessName} appears to be a property management company. They likely specialize in:
- Property management services
- Rental property management
- Residential property management
- Property maintenance and tenant relations

The website serves property owners, investors, and tenants. They provide comprehensive property management services including rent collection, maintenance coordination, tenant screening, and financial reporting.`;
    } else {
      businessContext = `**About ${businessName} (${websiteDomain}):**
You are analyzing SEO performance for ${businessName}. Focus on their specific business context and how SEO metrics relate to their goals.`;
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
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content: `You are Stuchai AI, an expert SEO analyst.

${businessContext}

**CRITICAL ACCURACY REQUIREMENTS:**
1. You MUST ONLY reference metrics, numbers, and data that are explicitly provided in the conversation context.
2. NEVER invent, estimate, assume, or hallucinate any numbers, percentages, or metrics not explicitly stated.
3. NEVER reference specific pages, queries, or content unless they are explicitly listed in the provided context data.
4. If you mention percentage changes, they MUST match exactly what is provided in the context.
5. If you don't have specific data for something the user asks about, you MUST say "I don't have that specific data available" rather than making assumptions.
6. You can discuss general SEO principles, industry trends, and best practices (general knowledge is acceptable), but ALL specific metrics and numbers MUST come from the provided data only.
7. When interpreting data, base conclusions strictly on actual patterns visible in the provided numbers - do not extrapolate or assume trends beyond what the data shows.

**Your Role:**
You provide concise, accurate, actionable insights based ONLY on the SEO data provided for ${websiteDomain}. You understand their business model and can relate SEO performance to their business goals - but always ground your analysis in the actual data provided.

**Guidelines:**
- Be helpful, specific, accurate, and focus on actionable recommendations based on actual data
- Relate SEO metrics to business outcomes (lead generation, visibility, market presence) only using provided metrics
- Consider local market dynamics and competition (general knowledge is acceptable here)
- Keep responses under 200 words unless more detail is needed
- Reference the business's services and market position when relevant
- If you don't have data to answer a question, say so clearly rather than guessing`
          },
          {
            role: 'user',
            content: `${contextPrompt}\n\nUser Question: ${message}`
          }
        ],
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
app.get('/api/competitors', optionalAuth, async (req, res) => {
  try {
    const { getCompetitiveSummary } = await import('./services/competitor-analysis');
    // Pass shared Prisma instance for better performance
    const summary = await getCompetitiveSummary(prisma);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching competitor analysis:', error);
    // Return cached/fallback data instead of error to avoid blocking UI
    res.json({
      summary: 'Competitive analysis unavailable. Please try again later.',
      topCompetitors: [],
      bergancoAdvantages: [],
      competitorAdvantages: [],
    });
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
// Task management endpoints
app.get('/api/tasks', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const { userId, weekStartDate } = req.query;
    
    const where: any = {};
    if (userId) where.userId = userId as string;
    if (weekStartDate) {
      const startDate = new Date(weekStartDate as string);
      where.weekStartDate = startDate;
    }
    
    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // Urgent/High priority first
        { dueDate: 'asc' },
      ],
    });
    
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, title, description, priority, dueDate, weekStartDate, weekEndDate } = req.body;
    
    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: new Date(dueDate),
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        assignedTo: req.user!.name,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true,
          },
        },
      },
    });
    
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (status !== 'COMPLETED') {
        updateData.completedAt = null;
      }
    }
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true,
          },
        },
      },
    });
    
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

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
    // Get all active sites and collect for each
    const activeSites = await prisma.site.findMany({
      where: { isActive: true },
    });
    
    if (activeSites.length === 0) {
      console.log('⏸️  No active sites found, skipping data collection');
      return;
    }
    
    for (const site of activeSites) {
      await collectAllMetrics(date, site.id, site.googleSiteUrl);
    }
    
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

// Migration endpoint - triggers BerganCo data migration
app.post('/api/admin/migrate-berganco', requireAuth, requireRole('ADMIN', 'EMPLOYEE'), async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🔄 Migration triggered via API...');
    
    // Import migration function
    const migrationModule = await import('./scripts/migrate-berganco-data');
    
    // Run migration synchronously, passing our Prisma instance
    // We need to run it and wait for completion to return accurate status
    try {
      await migrationModule.migrateBerganCoData(prisma);
      
      res.json({ 
        success: true, 
        message: 'Migration completed successfully!',
        note: 'All BerganCo data has been linked to the site. Check Site Management to verify.'
      });
    } catch (migrationError: any) {
      console.error('Migration execution error:', migrationError);
      res.status(500).json({ 
        error: 'Migration failed', 
        details: migrationError.message,
        note: 'Check Railway logs for more details.'
      });
    }
  } catch (error: any) {
    console.error('Error importing/starting migration:', error);
    res.status(500).json({ error: 'Failed to start migration', details: error.message });
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


