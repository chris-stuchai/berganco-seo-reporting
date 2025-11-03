/**
 * Site Access Utility
 * 
 * Helper functions for checking and managing user site access
 */

import { PrismaClient } from '@prisma/client';
import { getUserSites } from '../services/site-service';

const prisma = new PrismaClient();

/**
 * Checks if a user has access to a specific site
 */
export async function userHasSiteAccess(userId: string, siteId: string): Promise<boolean> {
  // Admin and Employee roles can access all sites
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === 'ADMIN' || user?.role === 'EMPLOYEE') {
    return true;
  }

  // For clients, check if they own or are assigned to the site
  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      OR: [
        { ownerId: userId },
        {
          clientSites: {
            some: { userId },
          },
        },
      ],
    },
  });

  return !!site;
}

/**
 * Gets the site IDs a user has access to
 * CRITICAL: For CLIENT users, this MUST only return sites they own or are assigned to
 */
export async function getUserAccessibleSiteIds(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    console.error(`[Site Access] User ${userId} not found`);
    return [];
  }

  // Admin and Employee can access all active sites
  if (user.role === 'ADMIN' || user.role === 'EMPLOYEE') {
    const allSites = await prisma.site.findMany({
      where: { isActive: true },
      select: { id: true, domain: true },
    });
    console.log(`[Site Access] ${user.role} user ${userId} - accessing all ${allSites.length} sites`);
    return allSites.map(s => s.id);
  }

  // For CLIENT users, ONLY return sites they own or are assigned to
  // This is critical for data isolation
  const sites = await getUserSites(userId);
  const siteIds = sites.map(s => s.id);
  
  // Log for debugging
  console.log(`[Site Access] CLIENT user ${userId} - accessing ${siteIds.length} site(s):`, 
    sites.map(s => `${s.domain} (${s.id})`).join(', '));
  
  if (siteIds.length === 0) {
    console.warn(`[Site Access] CLIENT user ${userId} has no accessible sites!`);
  }
  
  return siteIds;
}

