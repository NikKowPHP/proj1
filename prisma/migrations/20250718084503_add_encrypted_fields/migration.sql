-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "feedbackJsonEncrypted" TEXT,
ADD COLUMN     "rawAiResponseEncrypted" TEXT,
ALTER COLUMN "feedbackJson" DROP NOT NULL,
ALTER COLUMN "rawAiResponse" DROP NOT NULL;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "contentEncrypted" TEXT,
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Mistake" ADD COLUMN     "correctedTextEncrypted" TEXT,
ADD COLUMN     "explanationEncrypted" TEXT,
ADD COLUMN     "originalTextEncrypted" TEXT,
ALTER COLUMN "originalText" DROP NOT NULL,
ALTER COLUMN "correctedText" DROP NOT NULL,
ALTER COLUMN "explanation" DROP NOT NULL;
