/*
  Warnings:

  - You are about to drop the column `description` on the `Income` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Income` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - Added the required column `frequency` to the `Income` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Income` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Income" DROP COLUMN "description",
ADD COLUMN     "frequency" TEXT NOT NULL,
ADD COLUMN     "source" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);
