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
 */
export async function getUserAccessibleSiteIds(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Admin and Employee can access all active sites
  if (user?.role === 'ADMIN' || user?.role === 'EMPLOYEE') {
    const allSites = await prisma.site.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return allSites.map(s => s.id);
  }

  // For clients, get their sites
  const sites = await getUserSites(userId);
  return sites.map(s => s.id);
}

