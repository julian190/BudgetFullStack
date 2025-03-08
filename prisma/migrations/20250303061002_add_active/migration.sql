-- AlterTable
ALTER TABLE "Month" ADD COLUMN     "MonthNotes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT false;
