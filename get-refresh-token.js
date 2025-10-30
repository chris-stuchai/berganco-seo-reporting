require('dotenv').config();
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const code = '4/0Ab32j93PNk8FWE_jWYNkUz7A00ml1SbUAF9LNglwpD8FquXp2vDtIZ2y0MHpGHJ_beIH6w';

console.log('\n🔄 Exchanging code for refresh token...\n');

oauth2Client.getToken(code)
  .then(({ tokens }) => {
    console.log('✅ Success! Add this to your .env file:\n');
    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log('\n✅ You can now run data collection and reports!\n');
    
    // Also update the .env file automatically
    const fs = require('fs');
    let envContent = fs.readFileSync('.env', 'utf8');
    
    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
      envContent = envContent.replace(
        /GOOGLE_REFRESH_TOKEN=".*"/,
        `GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`
      );
    } else {
      envContent += `\nGOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"\n`;
    }
    
    fs.writeFileSync('.env', envContent);
    console.log('✅ Automatically updated .env file with refresh token!\n');
  })
  .catch((error) => {
    console.error('❌ Error getting tokens:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.error('\nThe code may have expired. Run npm run setup again to get a new code.');
    }
    process.exit(1);
  });

