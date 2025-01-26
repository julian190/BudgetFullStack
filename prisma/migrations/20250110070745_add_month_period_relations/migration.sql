/*
  Warnings:

  - A unique constraint covering the columns `[userId,year,monthNumber]` on the table `Month` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,startDate,endDate]` on the table `Period` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `monthId` to the `Period` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekName` to the `Period` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Period" ADD COLUMN     "monthId" TEXT NOT NULL,
ADD COLUMN     "weekName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Month_userId_year_monthNumber_key" ON "Month"("userId", "year", "monthNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Period_userId_startDate_endDate_key" ON "Period"("userId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
