#!/usr/bin/env tsx

/**
 * BerganCo Data Migration Script
 * 
 * This script migrates existing BerganCo data to the new multi-tenant architecture.
 * It:
 * 1. Creates a Site record for BerganCo
 * 2. Updates all existing metrics (DailyMetric, PageMetric, QueryMetric, WeeklyReport) to link to that site
 * 3. Links your existing user to that site
 * 
 * Usage: tsx src/scripts/migrate-berganco-data.ts [adminEmail]
 * Example: tsx src/scripts/migrate-berganco-data.ts admin@yourdomain.com
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as siteService from '../services/site-service';

dotenv.config();

const prisma = new PrismaClient();

async function migrateBerganCoData() {
  console.log('\n🔄 BerganCo Data Migration Script\n');
  console.log('This will:');
  console.log('1. Create a Site record for BerganCo');
  console.log('2. Link all existing metrics to that site');
  console.log('3. Link your admin user to that site\n');

  try {
    // Get BerganCo info from environment or defaults
    const domain = process.env.MIGRATE_DOMAIN || 'www.berganco.com';
    const displayName = process.env.MIGRATE_DISPLAY_NAME || 'BerganCo';
    const googleSiteUrl = process.env.MIGRATE_GOOGLE_SITE_URL || 'https://www.berganco.com';
    
    // Get admin email from args or env
    let adminEmail = process.argv[2] || process.env.ADMIN_EMAIL || process.env.MIGRATE_ADMIN_EMAIL;
    
    // If no email provided, try to find an admin user in the database
    if (!adminEmail) {
      console.log('📧 No admin email provided, searching database for admin user...');
      const adminUser = await prisma.user.findFirst({
        where: {
          OR: [
            { role: 'ADMIN' },
            { role: 'EMPLOYEE' },
          ],
        },
        orderBy: { createdAt: 'asc' }, // Get oldest admin (likely the first one created)
      });
      
      if (adminUser) {
        adminEmail = adminUser.email;
        console.log(`✅ Found admin user: ${adminEmail}\n`);
      } else {
        console.error('❌ Error: No admin user found in database');
        console.log('\nPlease either:');
        console.log('1. Provide admin email: npm run migrate-berganco <adminEmail>');
        console.log('2. Set ADMIN_EMAIL or MIGRATE_ADMIN_EMAIL environment variable');
        console.log('3. Create an admin user first using the admin creation setup');
        process.exit(1);
      }
    }

    console.log(`📍 Site Info:`);
    console.log(`   Domain: ${domain}`);
    console.log(`   Display Name: ${displayName}`);
    console.log(`   Google Site URL: ${googleSiteUrl}`);
    console.log(`   Admin Email: ${adminEmail}\n`);

    // Step 1: Check if site already exists
    let site = await prisma.site.findUnique({
      where: { domain },
    });

    if (site) {
      console.log(`✅ Site already exists: ${site.domain} (ID: ${site.id})`);
    } else {
      // Find or get admin user
      let adminUser = await prisma.user.findUnique({
        where: { email: adminEmail.toLowerCase() },
      });

      if (!adminUser) {
        console.error(`❌ Error: Admin user not found with email: ${adminEmail}`);
        console.log('\nAvailable users:');
        const allUsers = await prisma.user.findMany({
          select: { email: true, name: true, role: true },
        });
        allUsers.forEach(u => console.log(`   - ${u.email} (${u.name}, ${u.role})`));
        process.exit(1);
      }

      // Create site
      console.log('📦 Creating Site record...');
      site = await siteService.createSite({
        domain,
        displayName,
        googleSiteUrl,
        ownerId: adminUser.id,
      });
      console.log(`✅ Site created: ${site.domain} (ID: ${site.id})\n`);
    }

    // Step 2: Count existing metrics without siteId (check if siteId field exists and is null)
    console.log('📊 Counting existing metrics...');
    // Note: siteId is required now, so we'll check for any metrics and update them all
    const [dailyCount, pageCount, queryCount, reportCount] = await Promise.all([
      prisma.dailyMetric.count(),
      prisma.pageMetric.count(),
      prisma.queryMetric.count(),
      prisma.weeklyReport.count(),
    ]);
    
    // Check how many already have siteId
    const [dailyWithSite, pageWithSite, queryWithSite, reportWithSite] = await Promise.all([
      prisma.dailyMetric.count({ where: { siteId: site.id } }),
      prisma.pageMetric.count({ where: { siteId: site.id } }),
      prisma.queryMetric.count({ where: { siteId: site.id } }),
      prisma.weeklyReport.count({ where: { siteId: site.id } }),
    ]);
    
    const dailyToMigrate = dailyCount - dailyWithSite;
    const pageToMigrate = pageCount - pageWithSite;
    const queryToMigrate = queryCount - queryWithSite;
    const reportToMigrate = reportCount - reportWithSite;

    console.log(`   Total Daily Metrics: ${dailyCount} (${dailyWithSite} already linked, ${dailyToMigrate} to migrate)`);
    console.log(`   Total Page Metrics: ${pageCount} (${pageWithSite} already linked, ${pageToMigrate} to migrate)`);
    console.log(`   Total Query Metrics: ${queryCount} (${queryWithSite} already linked, ${queryToMigrate} to migrate)`);
    console.log(`   Total Weekly Reports: ${reportCount} (${reportWithSite} already linked, ${reportToMigrate} to migrate)\n`);

    if (dailyToMigrate === 0 && pageToMigrate === 0 && queryToMigrate === 0 && reportToMigrate === 0) {
      console.log('✅ All metrics already have siteId. Migration not needed.');
      return;
    }

    // Step 3: Update metrics that need migration
    console.log('🔄 Updating metrics with siteId...');

    let updatedDaily = 0;
    let updatedPage = 0;
    let updatedQuery = 0;
    let updatedReports = 0;

    if (dailyToMigrate > 0) {
      // Update metrics that don't have this siteId
      const result = await prisma.$executeRaw`
        UPDATE "DailyMetric" 
        SET "siteId" = ${site.id}
        WHERE "siteId" IS NULL OR "siteId" != ${site.id}
      `;
      updatedDaily = dailyToMigrate;
      console.log(`   ✅ Updated ${updatedDaily} daily metrics`);
    }

    if (pageToMigrate > 0) {
      const result = await prisma.$executeRaw`
        UPDATE "PageMetric" 
        SET "siteId" = ${site.id}
        WHERE "siteId" IS NULL OR "siteId" != ${site.id}
      `;
      updatedPage = pageToMigrate;
      console.log(`   ✅ Updated ${updatedPage} page metrics`);
    }

    if (queryToMigrate > 0) {
      const result = await prisma.$executeRaw`
        UPDATE "QueryMetric" 
        SET "siteId" = ${site.id}
        WHERE "siteId" IS NULL OR "siteId" != ${site.id}
      `;
      updatedQuery = queryToMigrate;
      console.log(`   ✅ Updated ${updatedQuery} query metrics`);
    }

    if (reportToMigrate > 0) {
      const result = await prisma.$executeRaw`
        UPDATE "WeeklyReport" 
        SET "siteId" = ${site.id}
        WHERE "siteId" IS NULL OR "siteId" != ${site.id}
      `;
      updatedReports = reportToMigrate;
      console.log(`   ✅ Updated ${updatedReports} weekly reports`);
    }

    console.log('\n✅ Migration Complete!\n');
    console.log('Summary:');
    console.log(`   Site: ${site.domain} (${site.id})`);
    console.log(`   Daily Metrics: ${updatedDaily} updated`);
    console.log(`   Page Metrics: ${updatedPage} updated`);
    console.log(`   Query Metrics: ${updatedQuery} updated`);
    console.log(`   Weekly Reports: ${updatedReports} updated\n`);

    console.log('Next Steps:');
    console.log('   1. Verify data in the dashboard');
    console.log('   2. All existing data is now linked to the BerganCo site');
    console.log('   3. You can now onboard additional clients using the admin dashboard\n');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.code === 'P2002') {
      console.error('   A site with this domain may already exist');
    }
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateBerganCoData();

