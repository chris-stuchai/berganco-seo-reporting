/**
 * Diagnostic Script: Check Client Site Assignments
 * 
 * This script helps diagnose multi-tenant data isolation issues
 * Usage: ts-node src/scripts/check-client-sites.ts [email]
 */

import { PrismaClient } from '@prisma/client';
import { getUserSites } from '../services/site-service';
import { getUserAccessibleSiteIds } from '../utils/site-access';

const prisma = new PrismaClient();

async function checkClientSites(email?: string) {
  try {
    console.log('\n🔍 Checking Client Site Assignments...\n');

    if (email) {
      // Check specific user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          ownedSites: true,
          clientSites: {
            include: {
              site: true,
            },
          },
        },
      });

      if (!user) {
        console.error(`❌ User ${email} not found`);
        return;
      }

      console.log(`\n📋 User: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}\n`);

      console.log(`\n🏢 Owned Sites (via ownerId):`);
      if (user.ownedSites.length === 0) {
        console.log('   ❌ No owned sites');
      } else {
        user.ownedSites.forEach(site => {
          console.log(`   ✓ ${site.displayName} (${site.domain}) [${site.id}]`);
        });
      }

      console.log(`\n🔗 Assigned Sites (via ClientSite):`);
      if (user.clientSites.length === 0) {
        console.log('   ❌ No assigned sites');
      } else {
        user.clientSites.forEach(cs => {
          console.log(`   ✓ ${cs.site.displayName} (${cs.site.domain}) [${cs.site.id}]`);
        });
      }

      // Get accessible sites via service
      const accessibleSites = await getUserSites(user.id);
      console.log(`\n📊 Total Accessible Sites (via getUserSites): ${accessibleSites.length}`);
      accessibleSites.forEach(site => {
        console.log(`   ✓ ${site.displayName} (${site.domain}) [${site.id}]`);
      });

      // Get accessible site IDs via utility
      const accessibleSiteIds = await getUserAccessibleSiteIds(user.id);
      console.log(`\n🎯 Accessible Site IDs (via getUserAccessibleSiteIds): ${accessibleSiteIds.length}`);
      accessibleSiteIds.forEach(id => {
        const site = accessibleSites.find(s => s.id === id);
        console.log(`   ✓ ${id} ${site ? `(${site.domain})` : '(NOT FOUND IN SITES)'}`);
      });

    } else {
      // Check all sites and their assignments
      const allSites = await prisma.site.findMany({
        include: {
          owner: {
            select: { id: true, email: true, name: true },
          },
          clientSites: {
            include: {
              user: {
                select: { id: true, email: true, name: true },
              },
            },
          },
        },
      });

      console.log(`\n📊 Total Sites: ${allSites.length}\n`);

      for (const site of allSites) {
        console.log(`\n🏢 ${site.displayName} (${site.domain})`);
        console.log(`   ID: ${site.id}`);
        console.log(`   Active: ${site.isActive}`);
        console.log(`   Owner: ${site.owner.name} (${site.owner.email})`);

        if (site.clientSites.length === 0) {
          console.log(`   ⚠️  No ClientSite assignments (only owner has access)`);
        } else {
          console.log(`   📋 Assigned to ${site.clientSites.length} user(s):`);
          site.clientSites.forEach(cs => {
            console.log(`      - ${cs.user.name} (${cs.user.email})`);
          });
        }
      }

      // Check all CLIENT users
      const clientUsers = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        include: {
          ownedSites: true,
          clientSites: {
            include: { site: true },
          },
        },
      });

      console.log(`\n\n👥 CLIENT Users: ${clientUsers.length}\n`);
      for (const user of clientUsers) {
        const accessibleSiteIds = await getUserAccessibleSiteIds(user.id);
        console.log(`\n${user.name} (${user.email})`);
        console.log(`   Owned: ${user.ownedSites.length} site(s)`);
        console.log(`   Assigned: ${user.clientSites.length} site(s)`);
        console.log(`   Accessible: ${accessibleSiteIds.length} site(s)`);
        if (accessibleSiteIds.length > 0) {
          accessibleSiteIds.forEach(id => {
            const site = await prisma.site.findUnique({ where: { id }, select: { domain: true } });
            console.log(`      - ${site?.domain || id}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run script
const email = process.argv[2];
checkClientSites(email);

