import {
  Prisma,
  PrismaClient,
  Transaction,
  TransactionCategory,
  TransactionType,
} from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function createInterestIncome(
  businessId: number,
  date: string | Date,
  notes: string,
  cardAmount: number,
  cashAmount: number,
): Promise<Transaction> {
  const transaction = await prisma.transaction.create({
    data: {
      business: { connect: { id: businessId } },
      type: TransactionType.INCOME,
      category: TransactionCategory.INTEREST,
      cardAmount,
      cashAmount,
      notes,
      occurredAt: new Date(date),
      updatedAt: new Date(),
    },
  });

  return transaction;
}

export async function createSale(
  businessId: number,
  clientId: number,
  date: string | Date,
  notes: string,
  cardAmount: number,
  cashAmount: number,
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
      occurredAt: new Date(date),
      updatedAt: new Date(),
    },
  });

  return transaction;
}

export async function createPersonalExpense(
  businessId: number,
  date: string | Date,
  notes: string,
  cardAmount: number,
  cashAmount: number,
): Promise<Transaction> {
  const transaction = await prisma.transaction.create({
    data: {
      business: { connect: { id: businessId } },
      type: TransactionType.EXPENSE,
      category: TransactionCategory.PERSONAL,
      cardAmount,
      cashAmount,
      notes,
      occurredAt: new Date(date),
      updatedAt: new Date(),
    },
  });

  return transaction;
}

export async function createBusinessExpense(
  businessId: number,
  date: string | Date,
  notes: string,
  cardAmount: number,
  cashAmount: number,
): Promise<Transaction> {
  const transaction = await prisma.transaction.create({
    data: {
      business: { connect: { id: businessId } },
      type: TransactionType.EXPENSE,
      category: TransactionCategory.BUSINESS,
      cardAmount,
      cashAmount,
      notes,
      occurredAt: new Date(date),
      updatedAt: new Date(),
    },
  });

  return transaction;
}

export async function createCashToCardConversion(
  businessId: number,
  date: string | Date,
  notes: string,
  amount: number,
): Promise<[Transaction, Transaction]> {
  const occurredAt = new Date(date);
  const shared: Partial<Prisma.TransactionCreateInput> = {
    business: { connect: { id: businessId } },
    category: TransactionCategory.CONVERT,
    notes,
    occurredAt,
    updatedAt: new Date(),
  };

  const [income, expense] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        ...shared,
        type: TransactionType.INCOME,
        cardAmount: amount,
        cashAmount: 0,
      } as Prisma.TransactionCreateInput,
    }),
    prisma.transaction.create({
      data: {
        ...shared,
        type: TransactionType.EXPENSE,
        cardAmount: 0,
        cashAmount: amount,
      } as Prisma.TransactionCreateInput,
    }),
  ]);

  return [income, expense];
}

export async function getTransactions(
  businessId: number,
  from: Date,
  to: Date,
) {
  return prisma.transaction.findMany({
    where: {
      businessId,
      occurredAt: { gte: from, lte: to },
    },
    include: { client: true },
    orderBy: { occurredAt: "desc" },
  });
}

export async function createCardToCashConversion(
  businessId: number,
  date: string | Date,
  notes: string,
  amount: number,
): Promise<[Transaction, Transaction]> {
  const occurredAt = new Date(date);
  const shared: Partial<Prisma.TransactionCreateInput> = {
    business: { connect: { id: businessId } },
    category: TransactionCategory.CONVERT,
    notes,
    occurredAt,
    updatedAt: new Date(),
  };

  const [income, expense] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        ...shared,
        type: TransactionType.INCOME,
        cardAmount: 0,
        cashAmount: amount,
      } as Prisma.TransactionCreateInput,
    }),
    prisma.transaction.create({
      data: {
        ...shared,
        type: TransactionType.EXPENSE,
        cardAmount: amount,
        cashAmount: 0,
      } as Prisma.TransactionCreateInput,
    }),
  ]);

  return [income, expense];
}
