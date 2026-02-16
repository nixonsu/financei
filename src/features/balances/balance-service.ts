import {
  CardBalanceSnapshot,
  CashBalanceSnapshot,
  PrismaClient,
} from "@/generated/prisma/client";
import { Balances } from "@/src/features/balances/balances";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function updateCardBalance(businessId: number, total: number) {
  await prisma.cardBalanceSnapshot.create({
    data: {
      id: undefined,
      businessId: businessId,
      total: total,
    },
  });
}

export async function updateCashBalance(
  businessId: number,
  fives: number,
  tens: number,
  twenties: number,
  fifties: number,
  hundreds: number,
) {
  await prisma.cashBalanceSnapshot.create({
    data: {
      id: undefined,
      businessId: businessId,
      fives: fives,
      tens: tens,
      twenties: twenties,
      fifties: fifties,
      hundreds: hundreds,
    },
  });
}

export async function getBalances(businessId: number): Promise<Balances> {
  const cardSnapshot: CardBalanceSnapshot =
    await prisma.cardBalanceSnapshot.findFirstOrThrow({
      where: {
        businessId: businessId,
      },
      orderBy: {
        recordedAt: "desc",
      },
    });

  const cashSnapshot: CashBalanceSnapshot =
    await prisma.cashBalanceSnapshot.findFirstOrThrow({
      where: {
        businessId: businessId,
      },
      orderBy: {
        recordedAt: "desc",
      },
    });

  const response: Balances = {
    cardBalance: {
      total: cardSnapshot.total.toNumber(),
    },
    cashBalance: {
      fives: cashSnapshot.fives,
      tens: cashSnapshot.tens,
      twenties: cashSnapshot.twenties,
      fifties: cashSnapshot.fifties,
      hundreds: cashSnapshot.hundreds,
      total: calculateTotalCashBalance(cashSnapshot),
    },
    variance: 100,
  };
  return response;
}

function calculateTotalCashBalance(cash: CashBalanceSnapshot): number {
  return (
    cash.fives * 5 +
    cash.tens * 10 +
    cash.twenties * 20 +
    cash.fifties * 50 +
    cash.hundreds * 100
  );
}
