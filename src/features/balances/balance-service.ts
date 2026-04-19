import {
  CardBalanceSnapshot,
  CashBalanceSnapshot,
  TransactionType,
} from "@/generated/prisma/client";
import {
  Balances,
  CurrentBalanceSummary,
} from "@/src/features/balances/balances";
import { prisma } from "@/src/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";

export async function getCurrentBalances(
  businessId: number,
): Promise<CurrentBalanceSummary> {
  const epoch = new Date(0);
  const lastClose = (await prisma.reconciliation.findFirst({
    where: { businessId },
    orderBy: { endPeriod: "desc" },
  })) ?? {
    startPeriod: epoch,
    endPeriod: epoch,
    actualCash: { toNumber: () => 0 },
    actualCard: { toNumber: () => 0 },
  };

  const transactions = await prisma.transaction.findMany({
    where: {
      businessId: businessId,
      occurredAt: { gt: lastClose.endPeriod },
    },
  });

  const totalCashIn = transactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.cashAmount.toNumber(), 0);
  const totalCashOut = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.cashAmount.toNumber(), 0);
  const totalCardIn = transactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.cardAmount.toNumber(), 0);
  const totalCardOut = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.cardAmount.toNumber(), 0);

  const openingCashBalance = lastClose.actualCash.toNumber();
  const openingCardBalance = lastClose.actualCard.toNumber();

  const expectedCashBalance = openingCashBalance + totalCashIn - totalCashOut;
  const expectedCardBalance = openingCardBalance + totalCardIn - totalCardOut;

  const actualBalances = await getBalances(businessId);

  const actualCashBalance = actualBalances.cashBalance.total;
  const actualCardBalance = actualBalances.cardBalance.total;

  return {
    from: lastClose.startPeriod,
    to: lastClose.endPeriod,
    expectedCashBalance: expectedCashBalance,
    expectedCardBalance: expectedCardBalance,
    totalExpectedBalance: expectedCashBalance + expectedCardBalance,
    actualCashBalance: actualCashBalance,
    actualCardBalance: actualCardBalance,
    totalActualBalance: actualCashBalance + actualCardBalance,
    variance:
      actualCashBalance +
      actualCardBalance -
      (expectedCashBalance + expectedCardBalance),
  };
}

export async function updateCardBalance(businessId: number, total: number) {
  if (isNaN(total)) {
    throw new Error("Invalid card balance amount");
  }

  try {
    await prisma.cardBalanceSnapshot.create({
      data: {
        id: undefined,
        businessId: businessId,
        total: total,
      },
    });
  } catch (error) {
    console.error("Failed to update card balance:", error);
    throw new Error("Failed to save card balance");
  }
}

export async function updateCashBalance(
  businessId: number,
  fives: number,
  tens: number,
  twenties: number,
  fifties: number,
  hundreds: number,
) {
  const values = { fives, tens, twenties, fifties, hundreds };
  for (const [key, value] of Object.entries(values)) {
    if (isNaN(value) || value < 0) {
      throw new Error(`Invalid value for ${key}`);
    }
  }

  try {
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
  } catch (error) {
    console.error("Failed to update cash balance:", error);
    throw new Error("Failed to save cash balance");
  }
}

export async function getBalances(businessId: number): Promise<Balances> {
  const cardSnapshot: Pick<CardBalanceSnapshot, "total"> =
    (await prisma.cardBalanceSnapshot.findFirst({
      where: { businessId },
      orderBy: { recordedAt: "desc" },
    })) ?? { total: new Decimal(0) };

  const cashSnapshot: Pick<
    CashBalanceSnapshot,
    "fives" | "tens" | "twenties" | "fifties" | "hundreds"
  > =
    (await prisma.cashBalanceSnapshot.findFirst({
      where: { businessId },
      orderBy: { recordedAt: "desc" },
    })) ?? { fives: 0, tens: 0, twenties: 0, fifties: 0, hundreds: 0 };

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

function calculateTotalCashBalance(
  cash: Pick<CashBalanceSnapshot, "fives" | "tens" | "twenties" | "fifties" | "hundreds">,
): number {
  return (
    cash.fives * 5 +
    cash.tens * 10 +
    cash.twenties * 20 +
    cash.fifties * 50 +
    cash.hundreds * 100
  );
}
