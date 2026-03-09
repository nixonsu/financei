import {
  PrismaClient,
  Transaction,
  TransactionCategory,
  TransactionType,
} from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function createSale(
  businessId: number,
  clientId: number,
  cardAmount: number,
  cashAmount: number,
  date: Date,
  notes: string,
): Promise<Transaction> {
  const transaction = await prisma.transaction.create({
    data: {
      business: { connect: { id: businessId } },
      client: { connect: { id: clientId } },
      type: TransactionType.INCOME,
      category: TransactionCategory.SALE,
      cardAmount,
      cashAmount,
      notes,
      occurredAt: date,
      updatedAt: new Date(),
    },
  });

  return transaction;
}
