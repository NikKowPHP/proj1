/*
  Warnings:

  - You are about to drop the column `aiAssessedProficiency` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `proficiencySubScores` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `targetLanguage` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,title,targetLanguage]` on the table `Topic` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Topic_userId_title_key";

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "targetLanguage" TEXT;

-- AlterTable
ALTER TABLE "SrsReviewItem" ADD COLUMN     "targetLanguage" TEXT;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "targetLanguage" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "aiAssessedProficiency",
DROP COLUMN "proficiencySubScores",
DROP COLUMN "targetLanguage",
ADD COLUMN     "defaultTargetLanguage" TEXT;

-- CreateTable
CREATE TABLE "LanguageProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "aiAssessedProficiency" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "proficiencySubScores" JSONB,

    CONSTRAINT "LanguageProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LanguageProfile_userId_language_key" ON "LanguageProfile"("userId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_userId_title_targetLanguage_key" ON "Topic"("userId", "title", "targetLanguage");

-- AddForeignKey
ALTER TABLE "LanguageProfile" ADD CONSTRAINT "LanguageProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
