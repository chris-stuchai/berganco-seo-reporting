-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageMetric" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "page" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryMetric" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "query" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "totalClicks" INTEGER NOT NULL,
    "totalImpressions" INTEGER NOT NULL,
    "averageCtr" DOUBLE PRECISION NOT NULL,
    "averagePosition" DOUBLE PRECISION NOT NULL,
    "clicksChange" DOUBLE PRECISION NOT NULL,
    "impressionsChange" DOUBLE PRECISION NOT NULL,
    "ctrChange" DOUBLE PRECISION NOT NULL,
    "positionChange" DOUBLE PRECISION NOT NULL,
    "insights" TEXT NOT NULL,
    "topPages" TEXT NOT NULL,
    "topQueries" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_date_key" ON "DailyMetric"("date");

-- CreateIndex
CREATE INDEX "DailyMetric_date_idx" ON "DailyMetric"("date");

-- CreateIndex
CREATE INDEX "PageMetric_date_idx" ON "PageMetric"("date");

-- CreateIndex
CREATE INDEX "PageMetric_page_idx" ON "PageMetric"("page");

-- CreateIndex
CREATE UNIQUE INDEX "PageMetric_date_page_key" ON "PageMetric"("date", "page");

-- CreateIndex
CREATE INDEX "QueryMetric_date_idx" ON "QueryMetric"("date");

-- CreateIndex
CREATE INDEX "QueryMetric_query_idx" ON "QueryMetric"("query");

-- CreateIndex
CREATE UNIQUE INDEX "QueryMetric_date_query_key" ON "QueryMetric"("date", "query");

-- CreateIndex
CREATE INDEX "WeeklyReport_weekStartDate_idx" ON "WeeklyReport"("weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_weekStartDate_weekEndDate_key" ON "WeeklyReport"("weekStartDate", "weekEndDate");

