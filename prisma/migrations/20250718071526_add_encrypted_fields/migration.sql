-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "feedbackJsonEncrypted" TEXT,
ADD COLUMN     "rawAiResponseEncrypted" TEXT;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "contentEncrypted" TEXT;

-- AlterTable
ALTER TABLE "Mistake" ADD COLUMN     "correctedTextEncrypted" TEXT,
ADD COLUMN     "explanationEncrypted" TEXT,
ADD COLUMN     "originalTextEncrypted" TEXT;
