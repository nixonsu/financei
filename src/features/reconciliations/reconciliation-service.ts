import { prisma } from "@/src/lib/prisma";

export async function createReconciliation(
  businessId: number,
  startPeriod: Date,
  endPeriod: Date,
  expectedCash: number,
  expectedCard: number,
  actualCash: number,
  actualCard: number,
) {
  await prisma.reconciliation.create({
    data: {
      businessId,
      startPeriod,
      endPeriod,
      expectedCash,
      expectedCard,
      actualCash,
      actualCard,
    },
  });
}

export async function getReconciliations(businessId: number) {
  return await prisma.reconciliation.findMany({
    where: {
      businessId,
    },
    orderBy: {
      endPeriod: "desc",
    },
  });
}
