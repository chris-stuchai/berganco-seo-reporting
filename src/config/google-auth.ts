/**
 * Google Search Console API Authentication Configuration
 * 
 * This module handles OAuth2 authentication for Google Search Console API.
 * You'll need to create OAuth2 credentials in Google Cloud Console.
 */

import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Creates and returns an authenticated OAuth2 client
 */
export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set refresh token if available
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
  }

  return oauth2Client;
}

/**
 * Generates the authorization URL for initial OAuth setup
 */
export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force to get refresh token
  });
}

/**
 * Exchanges authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

