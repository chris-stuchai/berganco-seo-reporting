-- AlterTable
ALTER TABLE "Task" ADD COLUMN "isAiGenerated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Task_isAiGenerated_idx" ON "Task"("isAiGenerated");

