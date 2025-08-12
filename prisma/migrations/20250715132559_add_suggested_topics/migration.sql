-- CreateTable
CREATE TABLE "SuggestedTopic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestedTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuggestedTopic_userId_title_targetLanguage_key" ON "SuggestedTopic"("userId", "title", "targetLanguage");

-- AddForeignKey
ALTER TABLE "SuggestedTopic" ADD CONSTRAINT "SuggestedTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
