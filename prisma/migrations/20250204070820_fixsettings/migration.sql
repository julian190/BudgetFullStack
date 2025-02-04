/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BudgetSetting_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_key" ON "Account"("userId");
