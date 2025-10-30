-- CreateEnum (if needed - ApiType)
-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL,
    "apiType" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "costEstimate" DOUBLE PRECISION,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleConfig" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiUsage_apiType_idx" ON "ApiUsage"("apiType");
CREATE INDEX "ApiUsage_createdAt_idx" ON "ApiUsage"("createdAt");
CREATE INDEX "LoginLog_userId_idx" ON "LoginLog"("userId");
CREATE INDEX "LoginLog_email_idx" ON "LoginLog"("email");
CREATE INDEX "LoginLog_createdAt_idx" ON "LoginLog"("createdAt");
CREATE UNIQUE INDEX "ScheduleConfig_jobType_key" ON "ScheduleConfig"("jobType");

