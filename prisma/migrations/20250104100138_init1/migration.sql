-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "BudgetShare" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "sharedWithUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetShare_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BudgetShare" ADD CONSTRAINT "BudgetShare_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetShare" ADD CONSTRAINT "BudgetShare_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
