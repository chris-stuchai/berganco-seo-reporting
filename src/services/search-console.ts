/**
 * Google Search Console API Service
 * 
 * Fetches SEO performance data from Google Search Console
 */

import { google } from 'googleapis';
import { getOAuth2Client } from '../config/google-auth';
import { logGoogleApiCall } from './api-tracking';

const DEFAULT_SITE_URL = process.env.SITE_URL || 'https://www.berganco.com';

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
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param siteUrl - Google Search Console site URL (e.g., "https://www.stuchai.com")
 */
export async function fetchSiteMetrics(startDate: string, endDate: string, siteUrl?: string) {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });
  const targetSiteUrl = siteUrl || DEFAULT_SITE_URL;

  try {
    const response = await searchConsole.searchanalytics.query({
      siteUrl: targetSiteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['date'],
        rowLimit: 25000,
      },
    });

    await logGoogleApiCall('/searchconsole/v1/searchanalytics/query', true);
    return response.data as SearchAnalyticsResponse;
  } catch (error) {
    await logGoogleApiCall('/searchconsole/v1/searchanalytics/query', false, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Fetches performance metrics grouped by page
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param siteUrl - Google Search Console site URL (optional)
 */
export async function fetchPageMetrics(startDate: string, endDate: string, siteUrl?: string) {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });
  const targetSiteUrl = siteUrl || DEFAULT_SITE_URL;

  try {
    const response = await searchConsole.searchanalytics.query({
      siteUrl: targetSiteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 25000,
      },
    });

    await logGoogleApiCall('/searchconsole/v1/searchanalytics/query', true);
    return response.data as SearchAnalyticsResponse;
  } catch (error) {
    await logGoogleApiCall('/searchconsole/v1/searchanalytics/query', false, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Fetches performance metrics grouped by search query
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param siteUrl - Google Search Console site URL (optional)
 */
export async function fetchQueryMetrics(startDate: string, endDate: string, siteUrl?: string) {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });
  const targetSiteUrl = siteUrl || DEFAULT_SITE_URL;

  try {
    const response = await searchConsole.searchanalytics.query({
      siteUrl: targetSiteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 25000,
      },
    });

    await logGoogleApiCall('/searchconsole/v1/searchanalytics/query', true);
    return response.data as SearchAnalyticsResponse;
  } catch (error) {
    await logGoogleApiCall('/searchconsole/v1/searchanalytics/query', false, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Fetches performance metrics for a specific date with page breakdown
 * @param date - Date in YYYY-MM-DD format
 * @param siteUrl - Google Search Console site URL (optional)
 */
export async function fetchDailyPageMetrics(date: string, siteUrl?: string) {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });
  const targetSiteUrl = siteUrl || DEFAULT_SITE_URL;

  const response = await searchConsole.searchanalytics.query({
    siteUrl: targetSiteUrl,
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
 * @param date - Date in YYYY-MM-DD format
 * @param siteUrl - Google Search Console site URL (optional)
 */
export async function fetchDailyQueryMetrics(date: string, siteUrl?: string) {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });
  const targetSiteUrl = siteUrl || DEFAULT_SITE_URL;

  const response = await searchConsole.searchanalytics.query({
    siteUrl: targetSiteUrl,
    requestBody: {
      startDate: date,
      endDate: date,
      dimensions: ['query'],
      rowLimit: 1000,
    },
  });

  return response.data as SearchAnalyticsResponse;
}

