-- AlterTable
ALTER TABLE "User" ALTER COLUMN "nativeLanguage" DROP NOT NULL,
ALTER COLUMN "targetLanguage" DROP NOT NULL,
ALTER COLUMN "writingStyle" DROP NOT NULL,
ALTER COLUMN "writingPurpose" DROP NOT NULL,
ALTER COLUMN "selfAssessedLevel" DROP NOT NULL;
