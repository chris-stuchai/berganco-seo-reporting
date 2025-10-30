#!/usr/bin/env tsx
/**
 * Test Google Search Console API Connection
 */

import * as dotenv from 'dotenv';
import { google } from 'googleapis';
import { getOAuth2Client } from './src/config/google-auth';

dotenv.config();

async function testConnection() {
  console.log('\n🔍 Testing Google Search Console API Connection...\n');

  try {
    // Test OAuth client
    console.log('1. Checking OAuth client...');
    const auth = getOAuth2Client();
    console.log('   ✅ OAuth client created');

    // Test API access
    console.log('\n2. Testing API access...');
    const searchConsole = google.searchconsole({ version: 'v1', auth });

    const siteUrl = process.env.SITE_URL || 'https://www.berganco.com';
    console.log(`   Site URL: ${siteUrl}`);

    // Try to fetch a small date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`   Date range: ${startDateStr} to ${endDateStr}`);

    const response = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDateStr,
        endDate: endDateStr,
        dimensions: ['date'],
        rowLimit: 10,
      },
    });

    console.log('   ✅ API connection successful!');
    console.log(`   ✅ Retrieved ${response.data.rows?.length || 0} data rows`);

    if (response.data.rows && response.data.rows.length > 0) {
      const latest = response.data.rows[0];
      console.log('\n3. Sample data:');
      console.log(`   Date: ${latest.keys?.[0]}`);
      console.log(`   Clicks: ${latest.clicks || 0}`);
      console.log(`   Impressions: ${latest.impressions || 0}`);
      console.log(`   CTR: ${((latest.ctr || 0) * 100).toFixed(2)}%`);
      console.log(`   Position: ${(latest.position || 0).toFixed(1)}`);
    }

    console.log('\n✅ All tests passed! Connection is working correctly.\n');
    return true;
  } catch (error: any) {
    console.error('\n❌ Connection test failed:');
    
    if (error.message?.includes('invalid_grant')) {
      console.error('   Error: Invalid or expired refresh token');
      console.error('   Solution: Run "npm run setup" again to get a new token');
    } else if (error.message?.includes('insufficient authentication')) {
      console.error('   Error: Not authenticated properly');
      console.error('   Solution: Check GOOGLE_REFRESH_TOKEN in .env');
    } else if (error.message?.includes('not found')) {
      console.error('   Error: Site not found in Search Console');
      console.error(`   Solution: Make sure ${process.env.SITE_URL} is added to Google Search Console`);
    } else {
      console.error(`   Error: ${error.message}`);
      console.error('   Full error:', error);
    }
    
    return false;
  }
}

testConnection();

