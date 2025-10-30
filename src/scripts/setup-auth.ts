#!/usr/bin/env tsx

/**
 * Google OAuth2 Setup Script
 * 
 * This script helps you authenticate with Google Search Console API
 * Run this once to get your refresh token
 */

import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { getAuthUrl, getTokensFromCode } from '../config/google-auth';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('\n🔐 Google Search Console OAuth2 Setup\n');
  console.log('This script will help you authenticate with Google Search Console API.');
  console.log('You need to have created OAuth2 credentials in Google Cloud Console.\n');

  // Check if credentials are set
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('❌ Missing Google OAuth2 credentials!');
    console.log('\nPlease follow these steps:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Create a new project or select an existing one');
    console.log('3. Enable the "Google Search Console API"');
    console.log('4. Go to "Credentials" and create OAuth 2.0 Client ID');
    console.log('5. Add your redirect URI (e.g., http://localhost:3000/oauth2callback)');
    console.log('6. Copy the Client ID and Client Secret to your .env file\n');
    process.exit(1);
  }

  console.log('✓ Google OAuth2 credentials found\n');

  // Generate auth URL
  const authUrl = getAuthUrl();
  console.log('Step 1: Visit this URL to authorize the application:\n');
  console.log(authUrl);
  console.log('\n');

  // Get authorization code from user
  const code = await question('Step 2: Enter the authorization code from the redirect URL: ');

  console.log('\n🔄 Exchanging code for tokens...\n');

  try {
    const tokens = await getTokensFromCode(code.trim());

    console.log('✅ Success! Add this to your .env file:\n');
    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log('\n');
    console.log('You can now run the data collection scripts!');
  } catch (error) {
    console.error('❌ Error getting tokens:', error);
    process.exit(1);
  }

  rl.close();
}

setup();

