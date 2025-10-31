/**
 * Client Onboarding Script
 * 
 * Script to easily onboard a new client and their website
 * Usage: ts-node src/scripts/onboard-client.ts <domain> <displayName> <ownerEmail>
 * Example: ts-node src/scripts/onboard-client.ts www.stuchai.com Stuchai support@stuchai.com
 */

import { PrismaClient } from '@prisma/client';
import * as siteService from '../services/site-service';
import * as authService from '../services/auth-service';

const prisma = new PrismaClient();

async function onboardClient(
  domain: string,
  displayName: string,
  ownerEmail: string,
  googleSiteUrl?: string
) {
  try {
    console.log(`\n🚀 Onboarding client: ${displayName} (${domain})...\n`);

    // Ensure googleSiteUrl format
    if (!googleSiteUrl) {
      googleSiteUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    }

    // 1. Find or create owner user
    let owner = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (!owner) {
      console.log(`Creating user account for ${ownerEmail}...`);
      // Generate a temporary password - should be changed on first login
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      const newUser = await authService.createUser(
        ownerEmail,
        tempPassword,
        displayName,
        'CLIENT',
        displayName
      );
      owner = await prisma.user.findUnique({
        where: { email: ownerEmail },
      });
      if (!owner) {
        throw new Error('Failed to create user');
      }
      console.log(`✓ Created user: ${owner.email}`);
      console.log(`⚠️  Temporary password: ${tempPassword} (user should change on first login)\n`);
    } else {
      console.log(`✓ Found existing user: ${owner.email}\n`);
    }

    // 2. Create site
    console.log(`Creating site: ${domain}...`);
    const site = await siteService.createSite({
      domain,
      displayName,
      googleSiteUrl,
      ownerId: owner!.id,
    });
    console.log(`✓ Created site: ${site.domain} (ID: ${site.id})\n`);

    // 3. Summary
    console.log('✅ Onboarding complete!\n');
    console.log('Summary:');
    console.log(`  - Site: ${site.domain}`);
    console.log(`  - Display Name: ${site.displayName}`);
    console.log(`  - Owner: ${owner!.email}`);
    console.log(`  - Site ID: ${site.id}`);
    console.log(`  - Google Site URL: ${site.googleSiteUrl}\n`);

    console.log('Next steps:');
    console.log('  1. Ensure Google OAuth is configured with access to this site');
    console.log('  2. Run data collection to start gathering SEO metrics');
    console.log(`  3. User can login at: /login (email: ${owner.email})\n`);

    return { site, owner };
  } catch (error: any) {
    console.error(`❌ Error onboarding client:`, error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: ts-node src/scripts/onboard-client.ts <domain> <displayName> <ownerEmail> [googleSiteUrl]');
  console.log('Example: ts-node src/scripts/onboard-client.ts www.stuchai.com Stuchai support@stuchai.com');
  process.exit(1);
}

const [domain, displayName, ownerEmail, googleSiteUrl] = args;

onboardClient(domain, displayName, ownerEmail, googleSiteUrl)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

