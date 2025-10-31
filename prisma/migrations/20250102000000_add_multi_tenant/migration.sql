-- CreateEnum
-- CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE', 'CLIENT'); -- Already exists

-- CreateTable: Site model
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "googleSiteUrl" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ClientSite junction table
CREATE TABLE "ClientSite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientSite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Site indexes
CREATE UNIQUE INDEX "Site_domain_key" ON "Site"("domain");
CREATE INDEX "Site_ownerId_idx" ON "Site"("ownerId");
CREATE INDEX "Site_domain_idx" ON "Site"("domain");

-- CreateIndex: ClientSite indexes
CREATE UNIQUE INDEX "ClientSite_userId_siteId_key" ON "ClientSite"("userId", "siteId");
CREATE INDEX "ClientSite_userId_idx" ON "ClientSite"("userId");
CREATE INDEX "ClientSite_siteId_idx" ON "ClientSite"("siteId");

-- AddForeignKey: Site owner
ALTER TABLE "Site" ADD CONSTRAINT "Site_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ClientSite relations
ALTER TABLE "ClientSite" ADD CONSTRAINT "ClientSite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientSite" ADD CONSTRAINT "ClientSite_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add siteId columns to existing tables
ALTER TABLE "DailyMetric" ADD COLUMN "siteId" TEXT;
ALTER TABLE "PageMetric" ADD COLUMN "siteId" TEXT;
ALTER TABLE "QueryMetric" ADD COLUMN "siteId" TEXT;
ALTER TABLE "WeeklyReport" ADD COLUMN "siteId" TEXT;

-- Create a default site for existing data (BerganCo)
-- First, we need to create a user for BerganCo if it doesn't exist, then create the site
-- This will be handled in application code, but we'll set up the structure

-- Create indexes for siteId columns
CREATE INDEX "DailyMetric_siteId_idx" ON "DailyMetric"("siteId");
CREATE INDEX "PageMetric_siteId_idx" ON "PageMetric"("siteId");
CREATE INDEX "QueryMetric_siteId_idx" ON "QueryMetric"("siteId");
CREATE INDEX "WeeklyReport_siteId_idx" ON "WeeklyReport"("siteId");

-- Update unique constraints to include siteId
-- Drop old unique constraints
ALTER TABLE "DailyMetric" DROP CONSTRAINT IF EXISTS "DailyMetric_date_key";
ALTER TABLE "PageMetric" DROP CONSTRAINT IF EXISTS "PageMetric_date_page_key";
ALTER TABLE "QueryMetric" DROP CONSTRAINT IF EXISTS "QueryMetric_date_query_key";
ALTER TABLE "WeeklyReport" DROP CONSTRAINT IF EXISTS "WeeklyReport_weekStartDate_weekEndDate_key";

-- Create new unique constraints with siteId
CREATE UNIQUE INDEX "DailyMetric_siteId_date_key" ON "DailyMetric"("siteId", "date");
CREATE UNIQUE INDEX "PageMetric_siteId_date_page_key" ON "PageMetric"("siteId", "date", "page");
CREATE UNIQUE INDEX "QueryMetric_siteId_date_query_key" ON "QueryMetric"("siteId", "date", "query");
CREATE UNIQUE INDEX "WeeklyReport_siteId_weekStartDate_weekEndDate_key" ON "WeeklyReport"("siteId", "weekStartDate", "weekEndDate");

-- Add foreign keys
ALTER TABLE "DailyMetric" ADD CONSTRAINT "DailyMetric_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageMetric" ADD CONSTRAINT "PageMetric_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QueryMetric" ADD CONSTRAINT "QueryMetric_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

