/**
 * API Usage Tracking Service
 * 
 * Tracks API calls for cost and usage monitoring
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Log Google API usage
 */
export async function logGoogleApiCall(endpoint: string, success: boolean, errorMessage?: string) {
  try {
    await prisma.apiUsage.create({
      data: {
        apiType: 'GOOGLE',
        endpoint,
        success,
        errorMessage,
      },
    });
  } catch (error) {
    console.error('Failed to log Google API usage:', error);
  }
}

/**
 * Log OpenAI API usage
 */
export async function logOpenAIApiCall(
  endpoint: string,
  tokensUsed: number,
  success: boolean,
  errorMessage?: string
) {
  try {
    // Calculate cost estimate (gpt-4o-mini pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens)
    // Using average of input/output ratio of 3:1
    const inputTokens = tokensUsed * 0.75;
    const outputTokens = tokensUsed * 0.25;
    const inputCost = (inputTokens / 1_000_000) * 0.15;
    const outputCost = (outputTokens / 1_000_000) * 0.60;
    const costEstimate = inputCost + outputCost;

    await prisma.apiUsage.create({
      data: {
        apiType: 'OPENAI',
        endpoint,
        tokensUsed,
        costEstimate,
        success,
        errorMessage,
      },
    });
  } catch (error) {
    console.error('Failed to log OpenAI API usage:', error);
  }
}

