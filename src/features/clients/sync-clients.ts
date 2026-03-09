import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import Papa from "papaparse";

import { downloadClientList } from "./download-clients";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
  console.log("Downloading client list from Acuity...");
  const csvPath = await downloadClientList();
  const file = fs.readFileSync(csvPath, "utf-8");

  console.log("Parsing CSV file...");
  const result: Papa.ParseResult<CsvClient> = Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) =>
      h.replace(/\s+/g, "").replace(/^./, (c) => c.toLowerCase()),
    transform: (value, field) => {
      if (field === "notes" || field === "phone") {
        const trimmedValue = value.replace(/'/g, "").trim();

        if (trimmedValue === "") {
          return null;
        }

        return trimmedValue;
      }
      return value;
    },
  });
  console.log(`Parsed CSV file with ${result.data.length} clients`);

  let created = 0;
  let updated = 0;

  console.log("Syncing clients with database...");
  for (const client of result.data) {
    const existingClient = await prisma.client.findFirst({
      where: {
        firstName: client.firstName,
        lastName: client.lastName,
      },
    });

    if (existingClient) {
      console.log(`EXISTS: ${client.firstName} ${client.lastName}`);

      let emailChanged = false;
      let phoneChanged = false;

      if (existingClient.email !== client.email) {
        emailChanged = true;
      }

      if (existingClient.phoneNumber !== client.phone) {
        phoneChanged = true;
      }

      if (emailChanged) {
        await prisma.client.updateMany({
          where: {
            firstName: client.firstName,
            lastName: client.lastName,
          },
          data: {
            email: client.email,
          },
        });
        console.log(
          `UPDATE: Email for ${client.firstName} ${client.lastName}: ${existingClient.email} -> ${client.email}`,
        );
        updated++;
      }

      if (phoneChanged) {
        await prisma.client.updateMany({
          where: {
            firstName: client.firstName,
            lastName: client.lastName,
          },
          data: {
            phoneNumber: client.phone,
          },
        });
        console.log(
          `UPDATE: Phone number for ${client.firstName} ${client.lastName}: ${existingClient.phoneNumber} -> ${client.phone}`,
        );
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
      console.log(`CREATE: ${client.firstName} ${client.lastName}`);
      created++;
    }
  }

  console.log("Finished syncing clients");

  fs.unlinkSync(csvPath);
  console.log("Cleaned up downloaded CSV");

  return { created, updated, total: result.data.length };
}
