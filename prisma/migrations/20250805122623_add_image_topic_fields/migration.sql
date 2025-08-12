-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'TEXT';
