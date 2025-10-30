/**
 * AI-Powered SEO Insights Service
 * 
 * Uses OpenAI to analyze SEO data and provide market-aware insights
 */

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

interface AIInsights {
  executiveSummary: string;
  marketContext: string;
  keyInsights: string[];
  urgentActions: string[];
  strategicRecommendations: string[];
  industryTrends: string;
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
            content: `You are an expert SEO analyst specializing in property management and real estate SEO. 
            Analyze SEO data considering:
            1. Current Google algorithm updates and SEO best practices
            2. Property management/real estate industry trends
            3. Competitive landscape and market dynamics
            4. Technical SEO factors
            5. Content strategy opportunities
            
            Provide actionable, specific recommendations. Be concise but comprehensive.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return generateFallbackInsights(context);
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return generateFallbackInsights(context);
    }

    // Parse structured response
    return parseAIResponse(aiResponse, context);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
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

Please provide analysis in the following JSON format:
{
  "executiveSummary": "2-3 sentence overview of the situation",
  "marketContext": "How current SEO trends and property management industry dynamics relate to this data",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "urgentActions": ["Action 1", "Action 2"],
  "strategicRecommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "industryTrends": "Relevant trends affecting property management SEO"
}

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

  // Critical issues
  if (changes.clicksChange < -20) {
    urgentActions.push('Immediate audit required: Investigate technical issues causing traffic drop');
    insights.push(`Traffic dropped ${Math.abs(changes.clicksChange).toFixed(1)}% - likely ranking or algorithm impact`);
  }

  if (changes.impressionsChange < -20) {
    urgentActions.push('Check for penalties or indexing issues in Google Search Console');
    insights.push(`Visibility decreased ${Math.abs(changes.impressionsChange).toFixed(1)}% - check indexing status`);
  }

  if (currentMetrics.averagePosition > 10) {
    recommendations.push('Focus on ranking improvement: Average position above 10 needs optimization');
  }

  if (currentMetrics.averageCtr < 0.02) {
    recommendations.push('CTR optimization: Low click-through rate suggests meta descriptions need improvement');
  }

  return {
    executiveSummary: `SEO performance shows ${changes.clicksChange >= 0 ? 'positive' : 'concerning'} trends with ${Math.abs(changes.clicksChange).toFixed(1)}% change in clicks.`,
    marketContext: 'Property management SEO is highly competitive. Focus on local SEO, quality content, and technical excellence.',
    keyInsights: insights.length > 0 ? insights : ['Monitoring ongoing SEO performance metrics.'],
    urgentActions: urgentActions.length > 0 ? urgentActions : [],
    strategicRecommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring and optimizing based on data trends.'],
    industryTrends: 'Property management SEO trends favor local search optimization, quality content, and fast-loading mobile experiences.',
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
    const prompt = `Briefly analyze SEO performance for ${context.websiteDomain}:

Current: ${context.currentMetrics.totalClicks} clicks, ${context.currentMetrics.totalImpressions} impressions
Change: ${context.changes.clicksChange >= 0 ? '+' : ''}${context.changes.clicksChange.toFixed(1)}% clicks, ${context.changes.impressionsChange >= 0 ? '+' : ''}${context.changes.impressionsChange.toFixed(1)}% impressions
Position: ${context.currentMetrics.averagePosition.toFixed(1)}, CTR: ${(context.currentMetrics.averageCtr * 100).toFixed(2)}%

Provide a 2-3 sentence insight considering current SEO trends and property management industry context. Be specific and actionable.`;

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
            content: 'You are a concise SEO analyst. Provide brief, actionable insights.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
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
      };
      return data.choices?.[0]?.message?.content || generateFallbackInsights(context).executiveSummary;
    }
  } catch (error) {
    console.error('Error generating quick insights:', error);
  }

  return generateFallbackInsights(context).executiveSummary;
}
