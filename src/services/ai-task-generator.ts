/**
 * AI-Powered Task Generation Service
 * 
 * Analyzes SEO performance data and automatically generates actionable tasks
 * for improving website SEO based on AI recommendations
 */

import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { logOpenAIApiCall } from './api-tracking';
import { PrismaClient as PrismaClientType } from '@prisma/client';

// Use passed instance or create new one
let prismaInstance: PrismaClientType | null = null;

function getPrisma() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

interface TaskGenerationContext {
  currentMetrics: {
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
  recommendations: string;
  websiteDomain: string;
  userId: string;
  weekStartDate: Date;
  weekEndDate: Date;
}

interface GeneratedTask {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

/**
 * Generates SEO tasks using AI based on current performance data
 */
export async function generateAITasks(context: TaskGenerationContext): Promise<GeneratedTask[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  OPENAI_API_KEY not set, skipping AI task generation');
    return [];
  }

  try {
    const prompt = buildTaskGenerationPrompt(context);
    
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
            content: `You are an expert SEO strategist. Based on SEO performance data, generate specific, actionable tasks that can improve search rankings, click-through rates, and overall visibility.

CRITICAL RULES:
1. Generate ONLY tasks based on the actual data provided - do NOT invent metrics or make assumptions
2. Each task should be specific, actionable, and measurable
3. Prioritize tasks based on potential impact (URGENT for critical issues, HIGH for high-impact opportunities, MEDIUM for standard improvements, LOW for nice-to-haves)
4. Focus on tasks that will improve the metrics showing negative trends or capitalize on positive trends
5. Tasks should be achievable within a week and relate to SEO best practices
6. Generate 3-5 tasks maximum - focus on the most important ones

Return tasks in JSON format only.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error for task generation:', error);
      await logOpenAIApiCall('/v1/chat/completions', 0, false, error);
      return [];
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

    await logOpenAIApiCall('/v1/chat/completions', tokensUsed, true);

    if (!aiResponse) {
      return [];
    }

    // Parse JSON response
    const tasks = parseTaskResponse(aiResponse);
    return tasks;
  } catch (error) {
    console.error('Error generating AI tasks:', error);
    await logOpenAIApiCall('/v1/chat/completions', 0, false, error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Builds the prompt for AI task generation
 */
function buildTaskGenerationPrompt(context: TaskGenerationContext): string {
  const { currentMetrics, changes, topPages, topQueries, recommendations, websiteDomain, weekStartDate, weekEndDate } = context;

  return `Analyze SEO performance for ${websiteDomain} and generate specific, actionable tasks to improve SEO.

**Period:** ${format(weekStartDate, 'MMM d')} - ${format(weekEndDate, 'MMM d, yyyy')}

**Current Metrics:**
- Total Clicks: ${currentMetrics.totalClicks.toLocaleString()}
- Total Impressions: ${currentMetrics.totalImpressions.toLocaleString()}
- Average CTR: ${(currentMetrics.averageCtr * 100).toFixed(2)}%
- Average Position: ${currentMetrics.averagePosition.toFixed(1)}

**Changes from Previous Period:**
- Clicks: ${changes.clicksChange >= 0 ? '+' : ''}${changes.clicksChange.toFixed(1)}%
- Impressions: ${changes.impressionsChange >= 0 ? '+' : ''}${changes.impressionsChange.toFixed(1)}%
- CTR: ${changes.ctrChange >= 0 ? '+' : ''}${changes.ctrChange.toFixed(1)}%
- Position: ${changes.positionChange >= 0 ? '+' : ''}${changes.positionChange.toFixed(1)} (lower is better)

**Top 5 Performing Pages:**
${topPages.slice(0, 5).map((p, i) => 
  `${i + 1}. ${p.page.replace(websiteDomain, '')}: ${p.clicks} clicks, ${p.impressions} impressions, ${(p.ctr * 100).toFixed(2)}% CTR, Position ${p.position.toFixed(1)}`
).join('\n')}

**Top 5 Search Queries:**
${topQueries.slice(0, 5).map((q, i) => 
  `${i + 1}. "${q.query}": ${q.clicks} clicks, Position ${q.position.toFixed(1)}, CTR ${(q.ctr * 100).toFixed(2)}%`
).join('\n')}

**Current Recommendations:**
${recommendations}

**CRITICAL:** Generate 3-5 specific, actionable SEO tasks based ONLY on this data. Each task should:
- Address a specific issue or opportunity identified in the data
- Be achievable within a week
- Have clear priority (URGENT for critical drops, HIGH for high-impact improvements, MEDIUM for standard optimizations, LOW for nice-to-haves)
- Include specific pages or queries to target if mentioned in the data

Return JSON format:
{
  "tasks": [
    {
      "title": "Specific task title (e.g., 'Optimize meta descriptions for top 5 pages')",
      "description": "Detailed description of what needs to be done, why it matters, and how to do it. Reference specific metrics or pages from the data.",
      "priority": "URGENT|HIGH|MEDIUM|LOW"
    }
  ]
}`;
}

/**
 * Parses AI response into task array
 */
function parseTaskResponse(response: string): GeneratedTask[] {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;
    
    const parsed = JSON.parse(jsonStr.trim());
    
    if (parsed.tasks && Array.isArray(parsed.tasks)) {
      return parsed.tasks.map((task: any) => ({
        title: task.title || 'SEO Task',
        description: task.description || 'Improve SEO performance',
        priority: (task.priority || 'MEDIUM').toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      })).filter((task: GeneratedTask) => 
        task.title && task.description && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(task.priority)
      );
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing task response:', error);
    return [];
  }
}

/**
 * Creates tasks in the database for a client based on AI analysis
 */
export async function createAITasksForClient(
  userId: string,
  weekStartDate: Date,
  weekEndDate: Date,
  context: TaskGenerationContext
): Promise<number> {
  try {
    const tasks = await generateAITasks({
      ...context,
      userId,
      weekStartDate,
      weekEndDate,
    });

    if (tasks.length === 0) {
      console.log('No AI tasks generated');
      return 0;
    }

    // Calculate due date (end of the week)
    const dueDate = new Date(weekEndDate);
    
    // Create all tasks
    let createdCount = 0;
    const prisma = getPrisma();
    
    // Check if tasks already exist for this week to avoid duplicates
    const existingTasks = await prisma.task.findMany({
      where: {
        userId,
        weekStartDate,
        isAiGenerated: true,
      },
    });
    
    if (existingTasks.length > 0) {
      console.log(`AI tasks already exist for user ${userId} week ${format(weekStartDate, 'yyyy-MM-dd')}`);
      return existingTasks.length;
    }
    
    for (const task of tasks) {
      try {
        await prisma.task.create({
          data: {
            userId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: 'PENDING',
            dueDate,
            weekStartDate,
            weekEndDate,
            isAiGenerated: true,
            assignedTo: 'AI Analysis System',
          },
        });
        createdCount++;
      } catch (error) {
        console.error(`Error creating task "${task.title}":`, error);
      }
    }

    console.log(`✓ Created ${createdCount} AI-generated tasks for user ${userId}`);
    return createdCount;
  } catch (error) {
    console.error('Error creating AI tasks:', error);
    return 0;
  }
}

