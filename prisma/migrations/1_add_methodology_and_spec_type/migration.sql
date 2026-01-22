-- Add methodology column to Project table
ALTER TABLE "Project" ADD COLUMN "methodology" TEXT NOT NULL DEFAULT 'agile';

-- Add specificationType column to Specification table
ALTER TABLE "Specification" ADD COLUMN "specificationType" TEXT NOT NULL DEFAULT 'user_story';
