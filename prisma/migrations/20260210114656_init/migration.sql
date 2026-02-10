-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('CONVERT', 'SALE', 'INTEREST', 'BUSINESS', 'PERSONAL');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "clientId" INTEGER,
    "cardAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cashAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_balance_snapshot" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_balance_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_balance_snapshot" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "fives" INTEGER NOT NULL DEFAULT 0,
    "tens" INTEGER NOT NULL DEFAULT 0,
    "twenties" INTEGER NOT NULL DEFAULT 0,
    "fifties" INTEGER NOT NULL DEFAULT 0,
    "hundreds" INTEGER NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_balance_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "business_userId_idx" ON "business"("userId");

-- CreateIndex
CREATE INDEX "client_businessId_idx" ON "client"("businessId");

-- CreateIndex
CREATE INDEX "transaction_businessId_idx" ON "transaction"("businessId");

-- CreateIndex
CREATE INDEX "transaction_clientId_idx" ON "transaction"("clientId");

-- CreateIndex
CREATE INDEX "transaction_createdAt_idx" ON "transaction"("createdAt");

-- CreateIndex
CREATE INDEX "card_balance_snapshot_businessId_idx" ON "card_balance_snapshot"("businessId");

-- CreateIndex
CREATE INDEX "card_balance_snapshot_recordedAt_idx" ON "card_balance_snapshot"("recordedAt");

-- CreateIndex
CREATE INDEX "cash_balance_snapshot_businessId_idx" ON "cash_balance_snapshot"("businessId");

-- CreateIndex
CREATE INDEX "cash_balance_snapshot_recordedAt_idx" ON "cash_balance_snapshot"("recordedAt");

-- AddForeignKey
ALTER TABLE "business" ADD CONSTRAINT "business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_balance_snapshot" ADD CONSTRAINT "card_balance_snapshot_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_balance_snapshot" ADD CONSTRAINT "cash_balance_snapshot_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
