/*
  Warnings:

  - You are about to drop the column `feedbackJsonEncrypted` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `rawAiResponseEncrypted` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `contentEncrypted` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `correctedTextEncrypted` on the `Mistake` table. All the data in the column will be lost.
  - You are about to drop the column `explanationEncrypted` on the `Mistake` table. All the data in the column will be lost.
  - You are about to drop the column `originalTextEncrypted` on the `Mistake` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "feedbackJsonEncrypted",
DROP COLUMN "rawAiResponseEncrypted",
ALTER COLUMN "feedbackJson" SET DATA TYPE TEXT,
ALTER COLUMN "rawAiResponse" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "JournalEntry" DROP COLUMN "contentEncrypted";

-- AlterTable
ALTER TABLE "Mistake" DROP COLUMN "correctedTextEncrypted",
DROP COLUMN "explanationEncrypted",
DROP COLUMN "originalTextEncrypted";
