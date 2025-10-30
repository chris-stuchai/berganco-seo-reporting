/**
 * Google Search Console API Service
 * 
 * Fetches SEO performance data from Google Search Console
 */

import { google } from 'googleapis';
import { getOAuth2Client } from '../config/google-auth';

const SITE_URL = process.env.SITE_URL || 'https://www.berganco.com';

export interface SearchAnalyticsRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
}

/**
 * Fetches overall site performance for a date range
 */
export async function fetchSiteMetrics(startDate: string, endDate: string) {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });

  const response = await searchConsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 25000,
    },
  });

  return response.data as SearchAnalyticsResponse;
}

/**
 * Fetches performance metrics grouped by page
 */
export async function fetchPageMetrics(startDate: string, endDate: string) {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });

  const response = await searchConsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 25000,
    },
  });

  return response.data as SearchAnalyticsResponse;
}

/**
 * Fetches performance metrics grouped by search query
 */
export async function fetchQueryMetrics(startDate: string, endDate: string) {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });

  const response = await searchConsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 25000,
    },
  });

  return response.data as SearchAnalyticsResponse;
}

/**
 * Fetches performance metrics for a specific date with page breakdown
 */
export async function fetchDailyPageMetrics(date: string) {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });

  const response = await searchConsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: date,
      endDate: date,
      dimensions: ['page'],
      rowLimit: 1000,
    },
  });

  return response.data as SearchAnalyticsResponse;
}

/**
 * Fetches performance metrics for a specific date with query breakdown
 */
export async function fetchDailyQueryMetrics(date: string) {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });

  const response = await searchConsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: date,
      endDate: date,
      dimensions: ['query'],
      rowLimit: 1000,
    },
  });

  return response.data as SearchAnalyticsResponse;
}

