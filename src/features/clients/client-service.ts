import { Client, PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import Papa from "papaparse";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export function getClients(businessId: number): Promise<Client[]> {
  return prisma.client.findMany({ where: { businessId: businessId } });
}

interface CsvClient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  notes: string | null;
}

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

export async function syncClients(businessId: number): Promise<SyncResult> {
  const file = fs.readFileSync("src/features/clients/list (7).csv", "utf-8");

  const result: Papa.ParseResult<CsvClient> = Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) =>
      h.replace(/\s+/g, "").replace(/^./, (c) => c.toLowerCase()),
    transform: (value, field) => {
      if (field === "notes" || field === "phone") {
        const trimmedValue = value.replace(/'/g, "").trim();
        return trimmedValue === "" ? null : trimmedValue;
      }
      return value;
    },
  });

  let created = 0;
  let updated = 0;

  for (const client of result.data) {
    const existingClient = await prisma.client.findFirst({
      where: {
        firstName: client.firstName,
        lastName: client.lastName,
      },
    });

    if (existingClient) {
      const updates: Record<string, string | null> = {};

      if (existingClient.email !== client.email) {
        updates.email = client.email;
      }
      if (existingClient.phoneNumber !== client.phone) {
        updates.phoneNumber = client.phone;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.client.updateMany({
          where: {
            firstName: client.firstName,
            lastName: client.lastName,
          },
          data: updates,
        });
        updated++;
      }
    } else {
      await prisma.client.create({
        data: {
          businessId,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phoneNumber: client.phone,
        },
      });
      created++;
    }
  }

  return { created, updated, total: result.data.length };
}
