/**
 * Weekly Report Generator
 * 
 * Analyzes SEO metrics and generates insights for weekly reports
 */

import { PrismaClient } from '@prisma/client';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { generateAIInsights } from './ai-service';

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
  endDate: Date
): Promise<WeeklyMetrics> {
  const metrics = await prisma.dailyMetric.findMany({
    where: {
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
async function getTopPages(startDate: Date, endDate: Date, limit: number = 10) {
  const pages = await prisma.pageMetric.groupBy({
    by: ['page'],
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
async function getTopQueries(startDate: Date, endDate: Date, limit: number = 10) {
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
    insights.push(`🔴 CRITICAL: Clicks dropped ${Math.abs(comparison.clicksChange).toFixed(1)}% - immediate attention needed`);
  } else if (comparison.clicksChange < -10) {
    insights.push(`⚠️  WARNING: Clicks decreased ${Math.abs(comparison.clicksChange).toFixed(1)}%`);
  } else if (comparison.clicksChange > 10) {
    insights.push(`✅ POSITIVE: Clicks increased ${comparison.clicksChange.toFixed(1)}%`);
  }

  // Impressions analysis
  if (comparison.impressionsChange < -20) {
    insights.push(`🔴 Visibility dropped significantly: ${Math.abs(comparison.impressionsChange).toFixed(1)}% fewer impressions`);
  } else if (comparison.impressionsChange < -10) {
    insights.push(`⚠️  Impressions decreased ${Math.abs(comparison.impressionsChange).toFixed(1)}%`);
  } else if (comparison.impressionsChange > 10) {
    insights.push(`✅ Visibility improved: ${comparison.impressionsChange.toFixed(1)}% more impressions`);
  }

  // CTR analysis
  if (comparison.ctrChange < -10) {
    insights.push(`⚠️  CTR declined ${Math.abs(comparison.ctrChange).toFixed(1)}% - titles/descriptions may need optimization`);
  } else if (comparison.ctrChange > 10) {
    insights.push(`✅ CTR improved ${comparison.ctrChange.toFixed(1)}% - better engagement`);
  }

  // Position analysis
  if (comparison.positionChange > 2) {
    insights.push(`🔴 Average ranking dropped ${comparison.positionChange.toFixed(1)} positions`);
  } else if (comparison.positionChange < -2) {
    insights.push(`✅ Average ranking improved ${Math.abs(comparison.positionChange).toFixed(1)} positions`);
  }

  // Overall assessment
  if (comparison.clicksChange < -10 && comparison.impressionsChange < -10) {
    insights.push(`📊 DIAGNOSIS: Both visibility AND engagement are down - likely a ranking/algorithm issue`);
  } else if (comparison.clicksChange < -10 && comparison.impressionsChange >= 0) {
    insights.push(`📊 DIAGNOSIS: Visibility is stable but clicks are down - CTR optimization needed`);
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
    recommendations.push('1. URGENT: Audit top pages for technical issues (404s, slow load times, mobile issues)');
    recommendations.push('2. Check Google Search Console for manual penalties or Core Web Vitals issues');
    recommendations.push('3. Review recent website changes that may have impacted SEO');
  }

  if (comparison.positionChange > 2) {
    recommendations.push('4. Analyze top-ranking competitors for content gaps');
    recommendations.push('5. Update content on declining pages with fresh information');
    recommendations.push('6. Build quality backlinks to key landing pages');
  }

  if (comparison.ctrChange < -10) {
    recommendations.push('7. Rewrite meta titles and descriptions for low-CTR pages');
    recommendations.push('8. Add schema markup to enhance search result appearance');
  }

  // Based on page performance
  const lowCtrPages = topPages.filter(p => p.ctr < 0.02 && p.impressions > 100);
  if (lowCtrPages.length > 0) {
    recommendations.push(`9. Optimize CTR for pages with high impressions but low CTR: ${lowCtrPages.slice(0, 3).map(p => p.page.split('/').pop()).join(', ')}`);
  }

  // Based on query performance
  const highImpLowCtr = topQueries.filter(q => q.impressions > 500 && q.ctr < 0.02);
  if (highImpLowCtr.length > 0) {
    recommendations.push(`10. Target high-impression, low-CTR queries: "${highImpLowCtr.slice(0, 2).map(q => q.query).join('", "')}"`);
  }

  // Opportunity keywords
  const opportunityQueries = topQueries.filter(q => q.position > 5 && q.position < 15 && q.impressions > 200);
  if (opportunityQueries.length > 0) {
    recommendations.push(`11. Quick win opportunities (position 5-15): "${opportunityQueries.slice(0, 3).map(q => q.query).join('", "')}"`);
  }

  return recommendations.join('\n') || 'Continue monitoring metrics and maintaining current SEO strategy.';
}

/**
 * Generates a complete weekly report
 */
export async function generateWeeklyReport(weekStartDate?: Date) {
  const startDate = weekStartDate || startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
  const endDate = endOfWeek(startDate, { weekStartsOn: 1 });

  const prevStartDate = subWeeks(startDate, 1);
  const prevEndDate = endOfWeek(prevStartDate, { weekStartsOn: 1 });

  console.log(`Generating report for ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}...`);

  // Calculate current and previous week metrics
  const currentMetrics = await calculateWeekMetrics(startDate, endDate);
  const previousMetrics = await calculateWeekMetrics(prevStartDate, prevEndDate);

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
  const topPages = await getTopPages(startDate, endDate);
  const topQueries = await getTopQueries(startDate, endDate);

  // Generate baseline insights and recommendations
  const insights = generateInsights(comparison);
  const recommendations = generateRecommendations(comparison, topPages, topQueries);

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
      websiteDomain: 'www.berganco.com',
      period: {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        previousStartDate: format(prevStartDate, 'yyyy-MM-dd'),
        previousEndDate: format(prevEndDate, 'yyyy-MM-dd'),
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
    ? `${insights}\n\n🤖 AI ANALYSIS:\n\n${aiInsights.executiveSummary}\n\nMarket Context: ${aiInsights.marketContext}\n\nKey Insights:\n${aiInsights.keyInsights.map((i, idx) => `• ${i}`).join('\n')}\n\nIndustry Trends: ${aiInsights.industryTrends}`
    : insights;

  const enhancedRecommendations = aiInsights
    ? `${recommendations}\n\n🤖 AI STRATEGIC RECOMMENDATIONS:\n\n${aiInsights.urgentActions.length > 0 ? 'URGENT ACTIONS:\n' + aiInsights.urgentActions.map((a, idx) => `${idx + 1}. ${a}`).join('\n') + '\n\n' : ''}STRATEGIC RECOMMENDATIONS:\n${aiInsights.strategicRecommendations.map((r, idx) => `${idx + 1}. ${r}`).join('\n')}`
    : recommendations;

  // Store report in database
  const report = await prisma.weeklyReport.create({
    data: {
      weekStartDate: startDate,
      weekEndDate: endDate,
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
    },
  });

  console.log('✓ Report generated successfully');

  return {
    report,
    currentMetrics,
    previousMetrics,
    topPages,
    topQueries,
    insights,
    recommendations,
  };
}

