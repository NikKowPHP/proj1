-- CreateEnum
CREATE TYPE "ReadingLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateTable
CREATE TABLE "ReadingMaterial" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "level" "ReadingLevel" NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadingMaterial_targetLanguage_level_idx" ON "ReadingMaterial"("targetLanguage", "level");
