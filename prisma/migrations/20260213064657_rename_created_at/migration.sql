/*
  Warnings:

  - You are about to drop the column `createdAt` on the `transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "transaction_createdAt_idx";

-- AlterTable
ALTER TABLE "transaction" DROP COLUMN "createdAt",
ADD COLUMN     "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "transaction_occurredAt_idx" ON "transaction"("occurredAt");
