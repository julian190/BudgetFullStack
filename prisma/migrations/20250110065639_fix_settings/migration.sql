/*
  Warnings:

  - You are about to drop the column `monthlyGoal` on the `BudgetSetting` table. All the data in the column will be lost.
  - Added the required column `ConfigName` to the `BudgetSetting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ConfigValue` to the `BudgetSetting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BudgetSetting" DROP COLUMN "monthlyGoal",
ADD COLUMN     "ConfigName" TEXT NOT NULL,
ADD COLUMN     "ConfigValue" TEXT NOT NULL;
