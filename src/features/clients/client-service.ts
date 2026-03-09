import { Client, PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export function getClients(businessId: number): Promise<Client[]> {
  return prisma.client.findMany({ where: { businessId: businessId } });
}

export { syncClients, type SyncResult } from "./sync-clients";
