/*
  MANUALLY VERIFIED MIGRATION
  
  This migration finalizes the application-layer encryption implementation.
  The automatically generated SQL by Prisma was destructive (dropping the new encrypted columns).
  This manually written SQL performs the following safe operations:

  1. Drop the original, now-redundant plaintext columns (e.g., "content", "feedbackJson"). Their data has already been migrated to the "...Encrypted" columns.
  2. Rename the "...Encrypted" columns to their final, clean names (e.g., "contentEncrypted" -> "content"). This preserves all the encrypted data.
  3. Apply the `NOT NULL` constraint to these newly renamed columns to match the final schema.
*/

-- Step 1: Drop the old, now redundant, plaintext columns.
ALTER TABLE "JournalEntry" DROP COLUMN "content";
ALTER TABLE "Analysis" DROP COLUMN "feedbackJson";
ALTER TABLE "Analysis" DROP COLUMN "rawAiResponse";
ALTER TABLE "Mistake" DROP COLUMN "originalText";
ALTER TABLE "Mistake" DROP COLUMN "correctedText";
ALTER TABLE "Mistake" DROP COLUMN "explanation";

-- Step 2: Rename the '...Encrypted' columns to their final, clean names.
ALTER TABLE "JournalEntry" RENAME COLUMN "contentEncrypted" TO "content";
ALTER TABLE "Analysis" RENAME COLUMN "feedbackJsonEncrypted" TO "feedbackJson";
ALTER TABLE "Analysis" RENAME COLUMN "rawAiResponseEncrypted" TO "rawAiResponse";
ALTER TABLE "Mistake" RENAME COLUMN "originalTextEncrypted" TO "originalText";
ALTER TABLE "Mistake" RENAME COLUMN "correctedTextEncrypted" TO "correctedText";
ALTER TABLE "Mistake" RENAME COLUMN "explanationEncrypted" TO "explanation";

-- Step 3: Apply the NOT NULL constraint to the newly renamed columns.
ALTER TABLE "JournalEntry" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "Analysis" ALTER COLUMN "feedbackJson" SET NOT NULL;
ALTER TABLE "Analysis" ALTER COLUMN "rawAiResponse" SET NOT NULL;
ALTER TABLE "Mistake" ALTER COLUMN "originalText" SET NOT NULL;
ALTER TABLE "Mistake" ALTER COLUMN "correctedText" SET NOT NULL;
ALTER TABLE "Mistake" ALTER COLUMN "explanation" SET NOT NULL;