/**
 * Google Search Console Issues Service
 * 
 * Fetches indexing issues, 404 errors, and other technical SEO problems
 * from Google Search Console API
 */

import { google } from 'googleapis';
import { getOAuth2Client } from '../config/google-auth';
import { logGoogleApiCall } from './api-tracking';

const SITE_URL = process.env.SITE_URL || 'https://www.berganco.com';

export interface IndexingIssue {
  page: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  lastDetected?: Date;
}

export interface CoverageIssue {
  url: string;
  issue: string;
  category: string;
  affectedUrls?: number;
}

/**
 * Fetches sitemaps and their submission status
 */
export async function fetchSitemapIssues() {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });

  try {
    const response = await searchConsole.sitemaps.list({
      siteUrl: SITE_URL,
    });

    await logGoogleApiCall('/searchconsole/v1/sitemaps/list', true);
    
    const sitemaps = response.data.sitemap || [];
    const issues: IndexingIssue[] = [];

    // Check for sitemap issues
    for (const sitemap of sitemaps) {
      if (sitemap.contents) {
        for (const content of sitemap.contents) {
          if (content.submitted && content.indexed !== undefined) {
            const indexedCount = parseInt(content.indexed || '0');
            const submittedCount = parseInt(content.submitted || '0');
            
            if (indexedCount < submittedCount * 0.8) {
              // Less than 80% indexed
              issues.push({
                page: sitemap.path || 'Unknown sitemap',
                issue: `Low indexing rate: ${indexedCount}/${submittedCount} URLs indexed (${Math.round((indexedCount/submittedCount)*100)}%)`,
                severity: 'warning',
              });
            }
            
            if (content.indexed === '0' && parseInt(content.submitted || '0') > 0) {
              issues.push({
                page: sitemap.path || 'Unknown sitemap',
                issue: `Sitemap has ${content.submitted} URLs but none are indexed`,
                severity: 'error',
              });
            }
          }
        }
      }
    }

    return issues;
  } catch (error) {
    await logGoogleApiCall('/searchconsole/v1/sitemaps/list', false, error instanceof Error ? error.message : 'Unknown error');
    console.error('Error fetching sitemap issues:', error);
    return [];
  }
}

/**
 * Inspects specific URLs for indexing issues
 * Note: This requires the URL Inspection API which may have limitations
 */
export async function inspectUrlForIssues(urls: string[]): Promise<IndexingIssue[]> {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });

  const issues: IndexingIssue[] = [];

  // Check up to 10 URLs (API rate limits)
  const urlsToCheck = urls.slice(0, 10);

  for (const url of urlsToCheck) {
    try {
      const response = await searchConsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: SITE_URL,
        },
      });

      await logGoogleApiCall('/searchconsole/v1/urlInspection/index/inspect', true);

      const data = response.data;
      
      if (data.inspectionResult?.indexStatusResult) {
        const status = data.inspectionResult.indexStatusResult;
        
        if (status.verdict === 'EXCLUDED') {
          issues.push({
            page: url,
            issue: status.verdict || 'Page excluded from indexing',
            severity: 'error',
          });
        }
        
        if (status.verdict === 'ERROR') {
          issues.push({
            page: url,
            issue: status.coverageState || 'Indexing error detected',
            severity: 'error',
          });
        }
      }
    } catch (error) {
      // URL Inspection API may not be available or may require special permissions
      // Silently continue to avoid blocking the entire process
      console.warn(`Could not inspect URL ${url}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return issues;
}

/**
 * Fetches pages with low CTR that might indicate indexing or content issues
 * Pages with many impressions but zero clicks might not be properly indexed or have poor content
 */
export async function identifyPotentialIndexingIssues(startDate: string, endDate: string): Promise<IndexingIssue[]> {
  const auth = getOAuth2Client();
  const searchConsole = google.searchconsole({ version: 'v1', auth });

  try {
    // Fetch pages with high impressions but zero clicks (potential indexing issues)
    const response = await searchConsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 1000,
      },
    });

    await logGoogleApiCall('/searchconsole/v1/searchanalytics/query', true);

    const rows = response.data.rows || [];
    const issues: IndexingIssue[] = [];

    for (const row of rows) {
      if (row.impressions && row.impressions > 100 && (!row.clicks || row.clicks === 0)) {
        // High impressions but no clicks could indicate:
        // - Poor title/meta description
        // - Content not matching search intent
        // - Indexing issues
        issues.push({
          page: row.keys?.[0] || 'Unknown',
          issue: `High impressions (${row.impressions}) but zero clicks - potential indexing or content mismatch issue`,
          severity: 'warning',
        });
      }
      
      if (row.position && row.position > 50 && row.impressions && row.impressions > 50) {
        // Very low position despite impressions might indicate indexing/crawling issues
        issues.push({
          page: row.keys?.[0] || 'Unknown',
          issue: `Low average position (${row.position.toFixed(1)}) with ${row.impressions} impressions - may need content optimization`,
          severity: 'info',
        });
      }
    }

    return issues;
  } catch (error) {
    await logGoogleApiCall('/searchconsole/v1/searchanalytics/query', false, error instanceof Error ? error.message : 'Unknown error');
    console.error('Error identifying indexing issues:', error);
    return [];
  }
}

/**
 * Aggregates all indexing and technical issues
 */
export async function getAllTechnicalIssues(startDate: string, endDate: string): Promise<{
  sitemapIssues: IndexingIssue[];
  potentialIssues: IndexingIssue[];
  totalErrors: number;
  totalWarnings: number;
}> {
  try {
    const [sitemapIssues, potentialIssues] = await Promise.all([
      fetchSitemapIssues(),
      identifyPotentialIndexingIssues(startDate, endDate),
    ]);

    const allIssues = [...sitemapIssues, ...potentialIssues];
    const totalErrors = allIssues.filter(i => i.severity === 'error').length;
    const totalWarnings = allIssues.filter(i => i.severity === 'warning').length;

    return {
      sitemapIssues,
      potentialIssues,
      totalErrors,
      totalWarnings,
    };
  } catch (error) {
    console.error('Error fetching technical issues:', error);
    return {
      sitemapIssues: [],
      potentialIssues: [],
      totalErrors: 0,
      totalWarnings: 0,
    };
  }
}

