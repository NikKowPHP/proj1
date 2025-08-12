
-- CreateEnum
CREATE TYPE "SrsItemType" AS ENUM ('MISTAKE', 'TRANSLATION', 'PRACTICE_MISTAKE');

-- AlterTable
-- This command alters the 'type' column. The USING clause explicitly tells PostgreSQL
-- how to cast the existing TEXT values to the new SrsItemType enum.
-- This prevents the column from being dropped and recreated, preserving all data.
ALTER TABLE "SrsReviewItem" ALTER COLUMN "type" SET DATA TYPE "SrsItemType" USING "type"::text::"SrsItemType";