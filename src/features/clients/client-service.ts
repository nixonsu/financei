import {
  Client,
  ClientSyncAttempt,
  PrismaClient,
} from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SYNC_HISTORY_LIMIT = 100;

export function getClients(businessId: number): Promise<Client[]> {
  return prisma.client.findMany({ where: { businessId: businessId } });
}

export function getClientSyncAttempts(
  businessId: number,
): Promise<ClientSyncAttempt[]> {
  return prisma.clientSyncAttempt.findMany({
    where: { businessId },
    orderBy: { attemptedAt: "desc" },
    take: SYNC_HISTORY_LIMIT,
  });
}

export {
  syncClients,
  type SyncClientsOptions,
  type SyncResult,
} from "./sync-clients";
