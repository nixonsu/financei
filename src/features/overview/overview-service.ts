import {
  CashBalanceSnapshot,
  PrismaClient,
  TransactionCategory,
  TransactionType,
} from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface Overview {
  totalCardIn: number;
  totalCardOut: number;
  totalCashIn: number;
  totalCashOut: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  netProfit: number;

  expectedCardBalance: number;
  expectedCashBalance: number;
  actualCardBalance: number;
  actualCashBalance: number;
  variance: number;

  totalSalesRevenue: number;
  totalBusinessExpenses: number;
  totalPersonalExpenses: number;
  totalInterest: number;
  transactionCount: number;
  saleCount: number;
  averageSaleValue: number;
  uniqueClientCount: number;
}

export async function getOverview(
  businessId: number,
  from?: Date,
  to?: Date,
): Promise<Overview> {
  const dateFilter =
    from && to ? { gte: from, lte: to } : from ? { gte: from } : undefined;

  const periodWhere = {
    businessId,
    ...(dateFilter ? { occurredAt: dateFilter } : {}),
  };

  const allTimeWhere = { businessId };

  const [periodAggregates, allTimeAggregates, actualBalances, periodStats] =
    await Promise.all([
      aggregateByTypeAndCategory(periodWhere),
      aggregateByTypeAndCategory(allTimeWhere),
      getActualBalances(businessId),
      getStatistics(periodWhere),
    ]);

  const totalCardIn = periodAggregates.incomeCard;
  const totalCardOut = periodAggregates.expenseCard;
  const totalCashIn = periodAggregates.incomeCash;
  const totalCashOut = periodAggregates.expenseCash;
  const totalMoneyIn = totalCardIn + totalCashIn;
  const totalMoneyOut = totalCardOut + totalCashOut;

  const expectedCardBalance =
    allTimeAggregates.incomeCard - allTimeAggregates.expenseCard;
  const expectedCashBalance =
    allTimeAggregates.incomeCash - allTimeAggregates.expenseCash;

  const expectedTotal = expectedCardBalance + expectedCashBalance;
  const actualTotal =
    actualBalances.actualCardBalance + actualBalances.actualCashBalance;

  return {
    totalCardIn,
    totalCardOut,
    totalCashIn,
    totalCashOut,
    totalMoneyIn,
    totalMoneyOut,
    netProfit: totalMoneyIn - totalMoneyOut,

    expectedCardBalance,
    expectedCashBalance,
    actualCardBalance: actualBalances.actualCardBalance,
    actualCashBalance: actualBalances.actualCashBalance,
    variance: actualTotal - expectedTotal,

    totalSalesRevenue: periodAggregates.salesRevenue,
    totalBusinessExpenses: periodAggregates.businessExpenses,
    totalPersonalExpenses: periodAggregates.personalExpenses,
    totalInterest: periodAggregates.interest,
    transactionCount: periodStats.transactionCount,
    saleCount: periodStats.saleCount,
    averageSaleValue: periodStats.averageSaleValue,
    uniqueClientCount: periodStats.uniqueClientCount,
  };
}

interface Aggregates {
  incomeCard: number;
  incomeCash: number;
  expenseCard: number;
  expenseCash: number;
  salesRevenue: number;
  businessExpenses: number;
  personalExpenses: number;
  interest: number;
}

async function aggregateByTypeAndCategory(
  where: Record<string, unknown>,
): Promise<Aggregates> {
  const groups = await prisma.transaction.groupBy({
    by: ["type", "category"],
    where,
    _sum: { cardAmount: true, cashAmount: true },
  });

  const result: Aggregates = {
    incomeCard: 0,
    incomeCash: 0,
    expenseCard: 0,
    expenseCash: 0,
    salesRevenue: 0,
    businessExpenses: 0,
    personalExpenses: 0,
    interest: 0,
  };

  for (const g of groups) {
    const card = g._sum.cardAmount?.toNumber() ?? 0;
    const cash = g._sum.cashAmount?.toNumber() ?? 0;

    if (g.type === TransactionType.INCOME) {
      result.incomeCard += card;
      result.incomeCash += cash;
    } else {
      result.expenseCard += card;
      result.expenseCash += cash;
    }

    if (g.category === TransactionCategory.SALE) {
      result.salesRevenue += card + cash;
    } else if (g.category === TransactionCategory.BUSINESS) {
      result.businessExpenses += card + cash;
    } else if (g.category === TransactionCategory.PERSONAL) {
      result.personalExpenses += card + cash;
    } else if (g.category === TransactionCategory.INTEREST) {
      result.interest += card + cash;
    }
  }

  return result;
}

async function getActualBalances(businessId: number) {
  const [cardSnapshot, cashSnapshot] = await Promise.all([
    prisma.cardBalanceSnapshot.findFirst({
      where: { businessId },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.cashBalanceSnapshot.findFirst({
      where: { businessId },
      orderBy: { recordedAt: "desc" },
    }),
  ]);

  const actualCardBalance = cardSnapshot?.total.toNumber() ?? 0;

  let actualCashBalance = 0;
  if (cashSnapshot) {
    actualCashBalance = calculateCashTotal(cashSnapshot);
  }

  return { actualCardBalance, actualCashBalance };
}

function calculateCashTotal(cash: CashBalanceSnapshot): number {
  return (
    cash.fives * 5 +
    cash.tens * 10 +
    cash.twenties * 20 +
    cash.fifties * 50 +
    cash.hundreds * 100
  );
}

async function getStatistics(where: Record<string, unknown>) {
  const [countResult, saleStats, uniqueClients] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({
      where: { ...where, category: TransactionCategory.SALE },
      _count: true,
      _sum: { cardAmount: true, cashAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["clientId"],
      where: {
        ...where,
        category: TransactionCategory.SALE,
        clientId: { not: null },
      },
    }),
  ]);

  const saleCount = saleStats._count;
  const saleTotal =
    (saleStats._sum.cardAmount?.toNumber() ?? 0) +
    (saleStats._sum.cashAmount?.toNumber() ?? 0);

  return {
    transactionCount: countResult,
    saleCount,
    averageSaleValue: saleCount > 0 ? saleTotal / saleCount : 0,
    uniqueClientCount: uniqueClients.length,
  };
}
