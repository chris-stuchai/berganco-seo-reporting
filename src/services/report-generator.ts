/**
 * Weekly Report Generator
 * 
 * Analyzes SEO metrics and generates insights for weekly reports
 */

import { PrismaClient } from '@prisma/client';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { generateAIInsights, type AIInsights } from './ai-service';

const prisma = new PrismaClient();

interface WeeklyMetrics {
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
}

interface ComparisonMetrics extends WeeklyMetrics {
  clicksChange: number;
  impressionsChange: number;
  ctrChange: number;
  positionChange: number;
}

/**
 * Calculates metrics for a given week
 */
async function calculateWeekMetrics(
  startDate: Date,
  endDate: Date,
  siteId: string
): Promise<WeeklyMetrics> {
  const metrics = await prisma.dailyMetric.findMany({
    where: {
      siteId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  if (metrics.length === 0) {
    return {
      totalClicks: 0,
      totalImpressions: 0,
      averageCtr: 0,
      averagePosition: 0,
    };
  }

  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
  const averageCtr = metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length;
  const averagePosition = metrics.reduce((sum, m) => sum + m.position, 0) / metrics.length;

  return {
    totalClicks,
    totalImpressions,
    averageCtr,
    averagePosition,
  };
}

/**
 * Gets top performing pages for a week
 */
async function getTopPages(startDate: Date, endDate: Date, siteId: string, limit: number = 10) {
  const pages = await prisma.pageMetric.groupBy({
    by: ['page'],
    where: {
      siteId,
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

  return pages.map(p => ({
    page: p.page,
    clicks: p._sum.clicks || 0,
    impressions: p._sum.impressions || 0,
    ctr: p._avg.ctr || 0,
    position: p._avg.position || 0,
  }));
}

/**
 * Gets top performing queries for a week
 */
async function getTopQueries(startDate: Date, endDate: Date, siteId: string, limit: number = 10) {
  const queries = await prisma.queryMetric.groupBy({
    by: ['query'],
    where: {
      siteId,
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

  return queries.map(q => ({
    query: q.query,
    clicks: q._sum.clicks || 0,
    impressions: q._sum.impressions || 0,
    ctr: q._avg.ctr || 0,
    position: q._avg.position || 0,
  }));
}

/**
 * Generates insights based on metric changes
 */
function generateInsights(comparison: ComparisonMetrics): string {
  const insights: string[] = [];

  // Traffic analysis
  if (comparison.clicksChange < -20) {
    insights.push(`CRITICAL: Clicks dropped ${Math.abs(comparison.clicksChange).toFixed(1)}% - immediate attention needed`);
  } else if (comparison.clicksChange < -10) {
    insights.push(`WARNING: Clicks decreased ${Math.abs(comparison.clicksChange).toFixed(1)}%`);
  } else if (comparison.clicksChange > 10) {
    insights.push(`POSITIVE: Clicks increased ${comparison.clicksChange.toFixed(1)}%`);
  }

  // Impressions analysis
  if (comparison.impressionsChange < -20) {
    insights.push(`Visibility dropped significantly: ${Math.abs(comparison.impressionsChange).toFixed(1)}% fewer impressions`);
  } else if (comparison.impressionsChange < -10) {
    insights.push(`Impressions decreased ${Math.abs(comparison.impressionsChange).toFixed(1)}%`);
  } else if (comparison.impressionsChange > 10) {
    insights.push(`Visibility improved: ${comparison.impressionsChange.toFixed(1)}% more impressions`);
  }

  // CTR analysis
  if (comparison.ctrChange < -10) {
    insights.push(`CTR declined ${Math.abs(comparison.ctrChange).toFixed(1)}% - titles/descriptions may need optimization`);
  } else if (comparison.ctrChange > 10) {
    insights.push(`CTR improved ${comparison.ctrChange.toFixed(1)}% - better engagement`);
  }

  // Position analysis
  if (comparison.positionChange > 2) {
    insights.push(`Average ranking dropped ${comparison.positionChange.toFixed(1)} positions`);
  } else if (comparison.positionChange < -2) {
    insights.push(`Average ranking improved ${Math.abs(comparison.positionChange).toFixed(1)} positions`);
  }

  // Overall assessment
  if (comparison.clicksChange < -10 && comparison.impressionsChange < -10) {
    insights.push(`DIAGNOSIS: Both visibility AND engagement are down - likely a ranking/algorithm issue`);
  } else if (comparison.clicksChange < -10 && comparison.impressionsChange >= 0) {
    insights.push(`DIAGNOSIS: Visibility is stable but clicks are down - CTR optimization needed`);
  }

  return insights.join('\n');
}

/**
 * Generates actionable recommendations
 */
function generateRecommendations(
  comparison: ComparisonMetrics,
  topPages: any[],
  topQueries: any[]
): string {
  const recommendations: string[] = [];

  // Based on overall trends
  if (comparison.clicksChange < -20) {
    recommendations.push('URGENT: Audit top pages for technical issues (404s, slow load times, mobile issues)');
    recommendations.push('Check Google Search Console for manual penalties or Core Web Vitals issues');
    recommendations.push('Review recent website changes that may have impacted SEO');
  }

  if (comparison.positionChange > 2) {
    recommendations.push('Analyze top-ranking competitors for content gaps');
    recommendations.push('Update content on declining pages with fresh information');
    recommendations.push('Build quality backlinks to key landing pages');
  }

  if (comparison.ctrChange < -10) {
    recommendations.push('Rewrite meta titles and descriptions for low-CTR pages');
    recommendations.push('Add schema markup to enhance search result appearance');
  }

  // Based on page performance
  const lowCtrPages = topPages.filter(p => p.ctr < 0.02 && p.impressions > 100);
  if (lowCtrPages.length > 0) {
    recommendations.push(`Optimize CTR for pages with high impressions but low CTR: ${lowCtrPages.slice(0, 3).map(p => p.page.split('/').pop()).join(', ')}`);
  }

  // Based on query performance
  const highImpLowCtr = topQueries.filter(q => q.impressions > 500 && q.ctr < 0.02);
  if (highImpLowCtr.length > 0) {
    recommendations.push(`Target high-impression, low-CTR queries: "${highImpLowCtr.slice(0, 2).map(q => q.query).join('", "')}"`);
  }

  // Opportunity keywords
  const opportunityQueries = topQueries.filter(q => q.position > 5 && q.position < 15 && q.impressions > 200);
  if (opportunityQueries.length > 0) {
    recommendations.push(`Quick win opportunities (position 5-15): "${opportunityQueries.slice(0, 3).map(q => q.query).join('", "')}"`);
  }

  // Number all recommendations starting from 1
  if (recommendations.length > 0) {
    return recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n');
  }

  return 'Continue monitoring metrics and maintaining current SEO strategy.';
}

/**
 * Gets daily trends data for a date range (for charts)
 */
async function getTrendsData(startDate: Date, endDate: Date, siteId: string): Promise<Array<{
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}>> {
  const metrics = await prisma.dailyMetric.findMany({
    where: {
      siteId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  return metrics.map(m => ({
    date: format(m.date, 'MMM d'),
    clicks: m.clicks,
    impressions: m.impressions,
    ctr: m.ctr,
    position: m.position,
  }));
}

/**
 * Generates a complete report for any date range
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @param periodType - Type of period ('week' | 'month' | 'custom')
 * @param siteId - Optional site ID (if not provided, will use first active site)
 * @param includeMonthlyComparison - Whether to include monthly comparison data (default: true for weekly reports)
 */
export async function generateReport(
  startDate?: Date,
  endDate?: Date,
  periodType: 'week' | 'month' | 'custom' = 'week',
  siteId?: string,
  includeMonthlyComparison: boolean = true
) {
  let calculatedStartDate: Date;
  let calculatedEndDate: Date;
  let calculatedPrevStartDate: Date;
  let calculatedPrevEndDate: Date;

  // Get siteId if not provided (use first active site)
  let targetSiteId = siteId;
  if (!targetSiteId) {
    const firstSite = await prisma.site.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (firstSite) {
      targetSiteId = firstSite.id;
    } else {
      throw new Error('No active sites found. Please create a site first.');
    }
  }

  if (startDate && endDate) {
    // Custom date range provided
    calculatedStartDate = startDate;
    calculatedEndDate = endDate;
    
    // Calculate previous period (same duration, ending just before start)
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    calculatedPrevEndDate = new Date(startDate);
    calculatedPrevEndDate.setDate(calculatedPrevEndDate.getDate() - 1);
    calculatedPrevStartDate = new Date(calculatedPrevEndDate);
    calculatedPrevStartDate.setDate(calculatedPrevStartDate.getDate() - periodDays + 1);
  } else if (periodType === 'month') {
    // Monthly report (last 30 days vs previous 30 days)
    calculatedEndDate = new Date();
    calculatedStartDate = new Date();
    calculatedStartDate.setDate(calculatedStartDate.getDate() - 30);
    
    calculatedPrevEndDate = new Date(calculatedStartDate);
    calculatedPrevEndDate.setDate(calculatedPrevEndDate.getDate() - 1);
    calculatedPrevStartDate = new Date(calculatedPrevEndDate);
    calculatedPrevStartDate.setDate(calculatedPrevStartDate.getDate() - 30);
  } else {
    // Weekly report (default)
    calculatedStartDate = startDate || startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    calculatedEndDate = endDate || endOfWeek(calculatedStartDate, { weekStartsOn: 1 });
    calculatedPrevStartDate = subWeeks(calculatedStartDate, 1);
    calculatedPrevEndDate = endOfWeek(calculatedPrevStartDate, { weekStartsOn: 1 });
  }

  console.log(`Generating ${periodType} report for ${format(calculatedStartDate, 'MMM d')} - ${format(calculatedEndDate, 'MMM d, yyyy')} (site: ${targetSiteId})...`);

  // Ensure targetSiteId is defined (should be set above)
  if (!targetSiteId) {
    throw new Error('Site ID is required but not found');
  }

  // Calculate current and previous period metrics
  const currentMetrics = await calculateWeekMetrics(calculatedStartDate, calculatedEndDate, targetSiteId);
  const previousMetrics = await calculateWeekMetrics(calculatedPrevStartDate, calculatedPrevEndDate, targetSiteId);
  
  // Calculate monthly comparison if enabled (for weekly reports)
  let monthlyCurrentMetrics: WeeklyMetrics | null = null;
  let monthlyPreviousMetrics: WeeklyMetrics | null = null;
  let monthlyComparison: ComparisonMetrics | null = null;
  
  if (includeMonthlyComparison && periodType === 'week') {
    // Last 30 days
    const monthEndDate = new Date(calculatedEndDate);
    const monthStartDate = new Date(monthEndDate);
    monthStartDate.setDate(monthStartDate.getDate() - 30);
    
    // Previous 30 days
    const prevMonthEndDate = new Date(monthStartDate);
    prevMonthEndDate.setDate(prevMonthEndDate.getDate() - 1);
    const prevMonthStartDate = new Date(prevMonthEndDate);
    prevMonthStartDate.setDate(prevMonthStartDate.getDate() - 30);
    
    monthlyCurrentMetrics = await calculateWeekMetrics(monthStartDate, monthEndDate, targetSiteId);
    monthlyPreviousMetrics = await calculateWeekMetrics(prevMonthStartDate, prevMonthEndDate, targetSiteId);
    
    const monthlyClicksChange = monthlyPreviousMetrics.totalClicks > 0
      ? ((monthlyCurrentMetrics.totalClicks - monthlyPreviousMetrics.totalClicks) / monthlyPreviousMetrics.totalClicks) * 100
      : 0;
    
    const monthlyImpressionsChange = monthlyPreviousMetrics.totalImpressions > 0
      ? ((monthlyCurrentMetrics.totalImpressions - monthlyPreviousMetrics.totalImpressions) / monthlyPreviousMetrics.totalImpressions) * 100
      : 0;
    
    const monthlyCtrChange = monthlyPreviousMetrics.averageCtr > 0
      ? ((monthlyCurrentMetrics.averageCtr - monthlyPreviousMetrics.averageCtr) / monthlyPreviousMetrics.averageCtr) * 100
      : 0;
    
    const monthlyPositionChange = monthlyCurrentMetrics.averagePosition - monthlyPreviousMetrics.averagePosition;
    
    monthlyComparison = {
      ...monthlyCurrentMetrics,
      clicksChange: monthlyClicksChange,
      impressionsChange: monthlyImpressionsChange,
      ctrChange: monthlyCtrChange,
      positionChange: monthlyPositionChange,
    };
    
    console.log(`Monthly comparison: ${monthlyClicksChange >= 0 ? '+' : ''}${monthlyClicksChange.toFixed(1)}% clicks (last 30 days)`);
  }
  
  // Get trends data for chart
  const trendsData = await getTrendsData(calculatedStartDate, calculatedEndDate, targetSiteId);

  // Calculate percentage changes
  const clicksChange = previousMetrics.totalClicks > 0
    ? ((currentMetrics.totalClicks - previousMetrics.totalClicks) / previousMetrics.totalClicks) * 100
    : 0;
  
  const impressionsChange = previousMetrics.totalImpressions > 0
    ? ((currentMetrics.totalImpressions - previousMetrics.totalImpressions) / previousMetrics.totalImpressions) * 100
    : 0;
  
  const ctrChange = previousMetrics.averageCtr > 0
    ? ((currentMetrics.averageCtr - previousMetrics.averageCtr) / previousMetrics.averageCtr) * 100
    : 0;
  
  const positionChange = currentMetrics.averagePosition - previousMetrics.averagePosition;

  const comparison: ComparisonMetrics = {
    ...currentMetrics,
    clicksChange,
    impressionsChange,
    ctrChange,
    positionChange,
  };

  // Get top pages and queries
  const topPages = await getTopPages(calculatedStartDate, calculatedEndDate, targetSiteId);
  const topQueries = await getTopQueries(calculatedStartDate, calculatedEndDate, targetSiteId);

  // Generate baseline insights and recommendations
  const insights = generateInsights(comparison);
  const recommendations = generateRecommendations(comparison, topPages, topQueries);

  // Get site info for domain
  const site = await prisma.site.findUnique({
    where: { id: targetSiteId },
    select: { domain: true },
  });

  // Generate AI-powered insights (enhances baseline insights)
  console.log('🤖 Generating AI-powered insights...');
  let aiInsights = null;
  try {
    const aiContext = {
      currentMetrics,
      previousMetrics,
      changes: {
        clicksChange,
        impressionsChange,
        ctrChange,
        positionChange,
      },
      topPages,
      topQueries,
      websiteDomain: site?.domain || 'unknown',
      period: {
        startDate: format(calculatedStartDate, 'yyyy-MM-dd'),
        endDate: format(calculatedEndDate, 'yyyy-MM-dd'),
        previousStartDate: format(calculatedPrevStartDate, 'yyyy-MM-dd'),
        previousEndDate: format(calculatedPrevEndDate, 'yyyy-MM-dd'),
      },
    };

    aiInsights = await generateAIInsights(aiContext);
    console.log('✓ AI insights generated');
  } catch (error) {
    console.error('Error generating AI insights:', error);
    // Continue without AI insights - use baseline
  }

  // Combine baseline and AI insights
  const enhancedInsights = aiInsights 
    ? `${insights}\n\nAI ANALYSIS:\n\n${aiInsights.executiveSummary}\n\nMarket Context: ${aiInsights.marketContext}\n\nKey Insights:\n${aiInsights.keyInsights.map((i, idx) => `• ${i}`).join('\n')}\n\nIndustry Trends: ${aiInsights.industryTrends}`
    : insights;

  const enhancedRecommendations = aiInsights
    ? `${recommendations}\n\nAI STRATEGIC RECOMMENDATIONS:\n\n${aiInsights.urgentActions.length > 0 ? 'URGENT ACTIONS:\n' + aiInsights.urgentActions.map((a, idx) => `${idx + 1}. ${a}`).join('\n') + '\n\n' : ''}STRATEGIC RECOMMENDATIONS:\n${aiInsights.strategicRecommendations.map((r, idx) => `${idx + 1}. ${r}`).join('\n')}`
    : recommendations;

  // Store report in database (use upsert to handle duplicates)
  // Check if report already exists first
  const existingReport = await prisma.weeklyReport.findUnique({
    where: {
      siteId_weekStartDate_weekEndDate: {
        siteId: targetSiteId,
        weekStartDate: calculatedStartDate,
        weekEndDate: calculatedEndDate,
      },
    },
  });

  const reportData = {
    totalClicks: currentMetrics.totalClicks,
    totalImpressions: currentMetrics.totalImpressions,
    averageCtr: currentMetrics.averageCtr,
    averagePosition: currentMetrics.averagePosition,
    clicksChange,
    impressionsChange,
    ctrChange,
    positionChange,
    insights: enhancedInsights,
    topPages: JSON.stringify(topPages),
    topQueries: JSON.stringify(topQueries),
    recommendations: enhancedRecommendations,
  };

  let report;
  if (existingReport) {
    // Update existing report
    report = await prisma.weeklyReport.update({
      where: { id: existingReport.id },
      data: reportData,
    });
    console.log(`✓ Updated existing report for ${format(calculatedStartDate, 'MMM d')} - ${format(calculatedEndDate, 'MMM d')}`);
  } else {
    // Create new report
    report = await prisma.weeklyReport.create({
      data: {
        siteId: targetSiteId,
        weekStartDate: calculatedStartDate,
        weekEndDate: calculatedEndDate,
        ...reportData,
      },
    });
    console.log(`✓ Created new report for ${format(calculatedStartDate, 'MMM d')} - ${format(calculatedEndDate, 'MMM d')}`);
  }

  console.log('✓ Report generated successfully');

  // Generate AI tasks for all client users after report generation
  try {
    const { createAITasksForClient } = await import('./ai-task-generator');
    const { getAllTechnicalIssues } = await import('./search-console-issues');
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT', isActive: true },
    });

    // Get each client's primary site for domain and technical issues
    for (const client of clients) {
      try {
        // Get client's primary site (or first accessible site)
        const clientSites = await prisma.site.findMany({
          where: {
            OR: [
              { ownerId: client.id },
              { clientSites: { some: { userId: client.id } } },
            ],
            isActive: true,
          },
          take: 1,
        });

        if (clientSites.length === 0) {
          console.log(`⚠️  No sites found for client ${client.email}, skipping AI task generation`);
          continue;
        }

        const clientSite = clientSites[0];

        // Fetch technical issues from Google Search Console for this site
        let technicalIssues = null;
        try {
          const startDateStr = format(calculatedStartDate, 'yyyy-MM-dd');
          const endDateStr = format(calculatedEndDate, 'yyyy-MM-dd');
          technicalIssues = await getAllTechnicalIssues(startDateStr, endDateStr, clientSite.googleSiteUrl);
          console.log(`✓ Found ${technicalIssues.totalErrors} errors and ${technicalIssues.totalWarnings} warnings for ${clientSite.domain}`);
        } catch (error) {
          console.error(`Error fetching technical issues for ${clientSite.domain}:`, error);
          // Continue without technical issues data
        }

        await createAITasksForClient(
          client.id,
          calculatedStartDate,
          calculatedEndDate,
          {
            currentMetrics,
            changes: {
              clicksChange,
              impressionsChange,
              ctrChange,
              positionChange,
            },
            topPages,
            topQueries,
            recommendations: enhancedRecommendations,
            websiteDomain: clientSite.domain,
            userId: client.id,
            weekStartDate: calculatedStartDate,
            weekEndDate: calculatedEndDate,
            technicalIssues: technicalIssues || undefined,
          }
        );
      } catch (error) {
        console.error(`Error generating AI tasks for client ${client.email}:`, error);
      }
    }
    console.log('✓ AI task generation completed');
  } catch (error) {
    console.error('Error during AI task generation:', error);
    // Don't fail report generation if task generation fails
  }

  return {
    report,
    currentMetrics,
    previousMetrics,
    topPages,
    topQueries,
    insights,
    recommendations,
    aiInsights,
    trendsData,
    periodType,
    startDate: calculatedStartDate,
    endDate: calculatedEndDate,
    monthlyComparison,
    monthlyCurrentMetrics,
    monthlyPreviousMetrics,
  };
}

/**
 * Generates a complete weekly report (backward compatibility)
 */
export async function generateWeeklyReport(weekStartDate?: Date) {
  return generateReport(weekStartDate, undefined, 'week');
}

