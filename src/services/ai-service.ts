/**
 * AI-Powered SEO Insights Service
 * 
 * Uses OpenAI to analyze SEO data and provide market-aware insights
 */

import { logOpenAIApiCall } from './api-tracking';

interface SEODataContext {
  currentMetrics: {
    totalClicks: number;
    totalImpressions: number;
    averageCtr: number;
    averagePosition: number;
  };
  previousMetrics: {
    totalClicks: number;
    totalImpressions: number;
    averageCtr: number;
    averagePosition: number;
  };
  changes: {
    clicksChange: number;
    impressionsChange: number;
    ctrChange: number;
    positionChange: number;
  };
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  websiteDomain: string;
  period: {
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  };
}

export interface AIInsights {
  executiveSummary: string;
  marketContext: string;
  keyInsights: string[];
  urgentActions: string[];
  strategicRecommendations: string[];
  industryTrends: string;
  wins?: string[];
  awareness?: string[];
  nextSteps?: string[];
}

/**
 * Generates AI-powered insights using OpenAI
 */
export async function generateAIInsights(context: SEODataContext): Promise<AIInsights> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  OPENAI_API_KEY not set, using fallback insights');
    return generateFallbackInsights(context);
  }

  try {
    const prompt = buildAnalysisPrompt(context);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          {
            role: 'system',
            content: `You are an expert SEO analyst specializing in property management and real estate SEO with an optimistic, growth-focused perspective.

CRITICAL ACCURACY RULES:
1. You MUST ONLY use data explicitly provided in the user's prompt. NEVER invent, estimate, or assume any numbers, metrics, or facts.
2. You MUST NOT reference pages, queries, or content unless they are specifically listed in the provided data.
3. You MUST NOT mention percentage changes unless they exactly match the numbers provided in the prompt.
4. If you reference specific metrics, they MUST be verbatim from the provided data.
5. If you don't have data for something, you MUST state "Data not available" rather than making assumptions.
6. You MUST base all insights strictly on actual patterns and trends visible in the provided data.

TONE & FRAMING:
- Frame performance in a positive, growth-oriented manner
- Highlight wins and opportunities prominently
- Even when discussing declines, focus on the opportunity for improvement and actionable solutions
- Use encouraging language like "opportunity to improve," "potential for growth," "optimization opportunity"
- Celebrate positive metrics and progress
- Position challenges as "areas for optimization" rather than failures

Your analysis should consider:
1. Current Google algorithm updates and SEO best practices (general knowledge is acceptable here)
2. Property management/real estate industry trends (general knowledge is acceptable)
3. Competitive landscape and market dynamics (general knowledge is acceptable)
4. Technical SEO factors (general knowledge is acceptable)
5. Content strategy opportunities (general knowledge is acceptable)

However, when discussing specific metrics, performance numbers, pages, or queries, you MUST ONLY reference what is explicitly provided in the data.

Provide actionable, specific recommendations based on the actual data provided. Be concise but comprehensive, with an optimistic and encouraging tone.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5, // Lower temperature for more accurate, factual responses
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      await logOpenAIApiCall('/v1/chat/completions', 0, false, error);
      return generateFallbackInsights(context);
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
    const aiResponse = data.choices?.[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    // Log successful API call
    await logOpenAIApiCall('/v1/chat/completions', tokensUsed, true);

    if (!aiResponse) {
      return generateFallbackInsights(context);
    }

    // Parse structured response
    return parseAIResponse(aiResponse, context);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    await logOpenAIApiCall('/v1/chat/completions', 0, false, error instanceof Error ? error.message : 'Unknown error');
    return generateFallbackInsights(context);
  }
}

/**
 * Builds the analysis prompt for OpenAI
 */
function buildAnalysisPrompt(context: SEODataContext): string {
  const { currentMetrics, previousMetrics, changes, topPages, topQueries, websiteDomain, period } = context;

  return `Analyze SEO performance for ${websiteDomain} and provide insights.

**Current Period:** ${period.startDate} to ${period.endDate}
**Previous Period:** ${period.previousStartDate} to ${period.previousEndDate}

**Current Metrics:**
- Total Clicks: ${currentMetrics.totalClicks.toLocaleString()}
- Total Impressions: ${currentMetrics.totalImpressions.toLocaleString()}
- Average CTR: ${(currentMetrics.averageCtr * 100).toFixed(2)}%
- Average Position: ${currentMetrics.averagePosition.toFixed(1)}

**Week-over-Week Changes:**
- Clicks: ${changes.clicksChange >= 0 ? '+' : ''}${changes.clicksChange.toFixed(1)}%
- Impressions: ${changes.impressionsChange >= 0 ? '+' : ''}${changes.impressionsChange.toFixed(1)}%
- CTR: ${changes.ctrChange >= 0 ? '+' : ''}${changes.ctrChange.toFixed(1)}%
- Position: ${changes.positionChange >= 0 ? '+' : ''}${changes.positionChange.toFixed(1)} (lower is better)

**Top 5 Performing Pages:**
${topPages.slice(0, 5).map((p, i) => 
  `${i + 1}. ${p.page}: ${p.clicks} clicks, ${p.impressions} impressions, ${(p.ctr * 100).toFixed(2)}% CTR, Position ${p.position.toFixed(1)}`
).join('\n')}

**Top 5 Search Queries:**
${topQueries.slice(0, 5).map((q, i) => 
  `${i + 1}. "${q.query}": ${q.clicks} clicks, ${q.impressions} impressions, ${(q.ctr * 100).toFixed(2)}% CTR, Position ${q.position.toFixed(1)}`
).join('\n')}

CRITICAL: You must ONLY use the data provided in this prompt. Do NOT invent, assume, or hallucinate any metrics, numbers, or facts not explicitly stated in the data. Base ALL insights strictly on the actual numbers and trends provided.

Please provide analysis in the following JSON format:
{
  "executiveSummary": "2-3 sentence overview of the situation and what this report covers - use ONLY the metrics provided",
  "marketContext": "How current SEO trends and property management industry dynamics relate to this data",
  "keyInsights": ["Insight 1 based on actual data", "Insight 2 based on actual data", "Insight 3 based on actual data"],
  "urgentActions": ["Action 1", "Action 2"],
  "strategicRecommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "industryTrends": "Relevant trends affecting property management SEO",
  "wins": ["Positive achievement based on ACTUAL metric changes provided", "Positive achievement based on ACTUAL data only", "Positive achievement based on ACTUAL data only"],
  "awareness": ["Issue or trend we are actively monitoring - based on actual data patterns", "Issue or trend we are actively monitoring - based on actual data patterns"],
  "nextSteps": ["Specific action item based on actual data patterns", "Specific action item based on actual data patterns", "Specific action item based on actual data patterns"]
}

IMPORTANT RULES:
1. ONLY reference metrics, percentages, and numbers that are explicitly provided in the data above
2. DO NOT make up or estimate any numbers
3. DO NOT reference pages, queries, or content unless they are specifically listed in the "Top 5 Performing Pages" or "Top 5 Search Queries" sections
4. If you mention a percentage change, it MUST match exactly what is provided in "Week-over-Week Changes"
5. If you mention specific pages or queries, they MUST be from the lists provided
6. Focus on patterns and trends visible in the actual data, not assumptions

Focus on actionable insights considering:
- Recent Google algorithm updates (Helpful Content Update, Core Updates, etc.)
- Property management/real estate SEO best practices
- Competitive opportunities based on query performance
- Content gaps and optimization opportunities
- Technical SEO factors that may be impacting performance`;
}

/**
 * Parses AI response into structured format
 */
function parseAIResponse(response: string, context: SEODataContext): AIInsights {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;
    
    const parsed = JSON.parse(jsonStr.trim());
    
    return {
      executiveSummary: parsed.executiveSummary || 'Analysis completed.',
      marketContext: parsed.marketContext || 'Market context analysis.',
      keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
      urgentActions: Array.isArray(parsed.urgentActions) ? parsed.urgentActions : [],
      strategicRecommendations: Array.isArray(parsed.strategicRecommendations) ? parsed.strategicRecommendations : [],
      industryTrends: parsed.industryTrends || 'Industry trends analysis.',
      wins: Array.isArray(parsed.wins) ? parsed.wins : undefined,
      awareness: Array.isArray(parsed.awareness) ? parsed.awareness : undefined,
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : undefined,
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    // Fallback: extract insights from free-form text
    return extractInsightsFromText(response, context);
  }
}

/**
 * Extracts insights from free-form AI response text
 */
function extractInsightsFromText(text: string, context: SEODataContext): AIInsights {
  const lines = text.split('\n').filter(l => l.trim());
  
  return {
    executiveSummary: lines.slice(0, 3).join(' ') || 'SEO performance analysis completed.',
    marketContext: 'Current market conditions and SEO trends are being analyzed.',
    keyInsights: lines.filter(l => l.includes('insight') || l.includes('finding') || l.includes('observation')).slice(0, 5),
    urgentActions: lines.filter(l => l.includes('urgent') || l.includes('immediate') || l.includes('critical')).slice(0, 3),
    strategicRecommendations: lines.filter(l => l.includes('recommend') || l.includes('should') || l.includes('consider')).slice(0, 5),
    industryTrends: 'Property management SEO trends are being evaluated.',
  };
}

/**
 * Fallback insights when AI is unavailable
 */
function generateFallbackInsights(context: SEODataContext): AIInsights {
  const { changes, currentMetrics } = context;

  const insights: string[] = [];
  const urgentActions: string[] = [];
  const recommendations: string[] = [];
  const wins: string[] = [];

  // Celebrate wins first
  if (changes.clicksChange > 0) {
    wins.push(`Traffic increased ${changes.clicksChange.toFixed(1)}% - strong momentum`);
  }
  if (changes.impressionsChange > 0) {
    wins.push(`Visibility improved ${changes.impressionsChange.toFixed(1)}% - reaching more users`);
  }
  if (changes.ctrChange > 0) {
    wins.push(`Click-through rate improved ${changes.ctrChange.toFixed(1)}% - better engagement`);
  }

  // Frame challenges as opportunities
  if (changes.clicksChange < -20) {
    urgentActions.push('Opportunity to boost traffic: Review recent changes and optimize top pages');
    insights.push(`Traffic optimization opportunity detected - potential to recover and exceed previous performance`);
  } else if (changes.clicksChange < -10) {
    recommendations.push('Opportunity to improve traffic: Focus on content optimization and meta descriptions');
  }

  if (changes.impressionsChange < -20) {
    urgentActions.push('Visibility opportunity: Review Google Search Console for optimization areas');
    insights.push(`Strong potential to increase visibility through targeted SEO improvements`);
  }

  if (currentMetrics.averagePosition > 10) {
    recommendations.push('Ranking growth opportunity: Significant potential to move up in search results');
  }

  if (currentMetrics.averageCtr < 0.02) {
    recommendations.push('CTR optimization opportunity: Enhance meta descriptions to attract more clicks');
  }

  // Always find something positive
  if (wins.length === 0) {
    wins.push('Stable baseline established - ready for optimization and growth');
  }

  return {
    executiveSummary: wins.length > 0 
      ? `SEO performance shows positive momentum with opportunities for continued growth.`
      : `Strong foundation in place with clear opportunities for optimization and growth.`,
    marketContext: 'Property management SEO presents excellent growth opportunities. Focus on local SEO, quality content, and technical excellence to capture more market share.',
    keyInsights: insights.length > 0 ? insights : ['Monitoring performance trends and identifying growth opportunities.'],
    urgentActions: urgentActions.length > 0 ? urgentActions : [],
    strategicRecommendations: recommendations.length > 0 ? recommendations : ['Continue optimizing based on data trends to maintain growth trajectory.'],
    industryTrends: 'Property management SEO trends favor local search optimization, quality content, and fast-loading mobile experiences - all areas with strong growth potential.',
    wins: wins.length > 0 ? wins : undefined,
  };
}

/**
 * Generates quick AI insights for dashboard (lighter analysis)
 */
export async function generateQuickAIInsights(context: SEODataContext): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return generateFallbackInsights(context).executiveSummary;
  }

  try {
    const prompt = `Briefly analyze SEO performance for ${context.websiteDomain} based ONLY on the following actual data:

**ACTUAL METRICS PROVIDED:**
- Current Clicks: ${context.currentMetrics.totalClicks}
- Current Impressions: ${context.currentMetrics.totalImpressions}
- Change in Clicks: ${context.changes.clicksChange >= 0 ? '+' : ''}${context.changes.clicksChange.toFixed(1)}%
- Change in Impressions: ${context.changes.impressionsChange >= 0 ? '+' : ''}${context.changes.impressionsChange.toFixed(1)}%
- Average Position: ${context.currentMetrics.averagePosition.toFixed(1)}
- Average CTR: ${(context.currentMetrics.averageCtr * 100).toFixed(2)}%

**CRITICAL: You MUST ONLY reference these exact numbers. Do NOT invent, estimate, or assume any other metrics or facts. Base your insight strictly on these actual numbers and their changes.**

Provide a 2-3 sentence insight considering current SEO trends and property management industry context. Be specific and actionable, but only discuss what the data shows.`;

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
            content: `You are a concise SEO analyst. Provide brief, actionable insights based ONLY on the actual data provided. NEVER invent, estimate, or assume metrics not explicitly stated. You can reference general SEO trends and property management industry knowledge, but specific numbers MUST come from the provided data only.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5, // Lower temperature for more accurate, factual responses
        max_tokens: 150,
      }),
    });

    if (response.ok) {
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
      const tokensUsed = data.usage?.total_tokens || 0;
      await logOpenAIApiCall('/v1/chat/completions', tokensUsed, true);
      return data.choices?.[0]?.message?.content || generateFallbackInsights(context).executiveSummary;
    } else {
      await logOpenAIApiCall('/v1/chat/completions', 0, false, `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Error generating quick insights:', error);
    await logOpenAIApiCall('/v1/chat/completions', 0, false, error instanceof Error ? error.message : 'Unknown error');
  }

  return generateFallbackInsights(context).executiveSummary;
}
