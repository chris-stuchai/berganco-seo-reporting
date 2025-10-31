/**
 * Site Management Service
 * 
 * Handles site creation, client assignment, and site access management
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateSiteInput {
  domain: string; // e.g., "www.stuchai.com"
  displayName: string; // e.g., "Stuchai"
  googleSiteUrl: string; // Full URL: "https://www.stuchai.com"
  ownerId: string; // User ID who owns this site
}

/**
 * Creates a new site and assigns it to the owner
 */
export async function createSite(input: CreateSiteInput) {
  // Validate domain format
  if (!input.domain || !input.googleSiteUrl) {
    throw new Error('Domain and Google Site URL are required');
  }

  // Ensure googleSiteUrl is a valid URL
  try {
    new URL(input.googleSiteUrl);
  } catch {
    throw new Error('Invalid Google Site URL format');
  }

  // Check if site already exists
  const existing = await prisma.site.findUnique({
    where: { domain: input.domain },
  });

  if (existing) {
    throw new Error(`Site with domain ${input.domain} already exists`);
  }

  // Verify owner exists
  const owner = await prisma.user.findUnique({
    where: { id: input.ownerId },
  });

  if (!owner) {
    throw new Error('Owner user not found');
  }

  // Create site
  const site = await prisma.site.create({
    data: {
      domain: input.domain,
      displayName: input.displayName,
      googleSiteUrl: input.googleSiteUrl,
      ownerId: input.ownerId,
      isActive: true,
    },
  });

  // Auto-assign site to owner via ClientSite (for consistent querying)
  await prisma.clientSite.create({
    data: {
      userId: input.ownerId,
      siteId: site.id,
    },
  });

  console.log(`✓ Created site: ${site.domain} (${site.displayName})`);

  return site;
}

/**
 * Gets all sites a user has access to (owned or assigned)
 */
export async function getUserSites(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedSites: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
      clientSites: {
        where: {
          site: { isActive: true },
        },
        include: {
          site: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    return [];
  }

  // Combine owned sites and assigned sites, removing duplicates
  const siteMap = new Map();

  // Add owned sites
  user.ownedSites.forEach(site => {
    siteMap.set(site.id, site);
  });

  // Add assigned sites
  user.clientSites.forEach(cs => {
    siteMap.set(cs.site.id, cs.site);
  });

  return Array.from(siteMap.values());
}

/**
 * Gets the primary site for a user (their first/primary site)
 */
export async function getUserPrimarySite(userId: string) {
  const sites = await getUserSites(userId);
  return sites[0] || null;
}

/**
 * Assigns a site to a client user
 */
export async function assignSiteToClient(siteId: string, userId: string) {
  // Verify site exists
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site) {
    throw new Error('Site not found');
  }

  // Verify user exists and is a client
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== 'CLIENT') {
    throw new Error('Can only assign sites to CLIENT role users');
  }

  // Check if already assigned
  const existing = await prisma.clientSite.findUnique({
    where: {
      userId_siteId: {
        userId,
        siteId,
      },
    },
  });

  if (existing) {
    return existing; // Already assigned
  }

  // Assign site
  const clientSite = await prisma.clientSite.create({
    data: {
      userId,
      siteId,
    },
    include: {
      site: true,
      user: true,
    },
  });

  console.log(`✓ Assigned site ${site.domain} to user ${user.email}`);

  return clientSite;
}

/**
 * Removes site assignment from a client
 */
export async function unassignSiteFromClient(siteId: string, userId: string) {
  await prisma.clientSite.delete({
    where: {
      userId_siteId: {
        userId,
        siteId,
      },
    },
  });

  console.log(`✓ Unassigned site ${siteId} from user ${userId}`);
}

/**
 * Gets all sites (admin function)
 */
export async function getAllSites() {
  return prisma.site.findMany({
    where: { isActive: true },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          businessName: true,
        },
      },
      clientSites: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              businessName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Updates site information
 */
export async function updateSite(
  siteId: string,
  updates: Partial<Pick<CreateSiteInput, 'displayName' | 'googleSiteUrl' | 'domain'>>
) {
  return prisma.site.update({
    where: { id: siteId },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
  });
}

/**
 * Deactivates a site (soft delete)
 */
export async function deactivateSite(siteId: string) {
  return prisma.site.update({
    where: { id: siteId },
    data: {
      isActive: false,
      updatedAt: new Date(),
    },
  });
}

