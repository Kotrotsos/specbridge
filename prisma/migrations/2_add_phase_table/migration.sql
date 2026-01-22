-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "phaseName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedItem" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceMessageId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractedItem_pkey" PRIMARY KEY ("id")
);

-- Add phaseId column to Specification table
ALTER TABLE "Specification" ADD COLUMN "phaseId" TEXT;

-- CreateIndex
CREATE INDEX "Phase_featureId_idx" ON "Phase"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "Phase_featureId_phaseNumber_key" ON "Phase"("featureId", "phaseNumber");

-- CreateIndex
CREATE INDEX "ExtractedItem_phaseId_idx" ON "ExtractedItem"("phaseId");

-- CreateIndex
CREATE INDEX "Specification_phaseId_idx" ON "Specification"("phaseId");

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedItem" ADD CONSTRAINT "ExtractedItem_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specification" ADD CONSTRAINT "Specification_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
