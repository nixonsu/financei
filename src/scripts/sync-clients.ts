import "dotenv/config";

import { ClientSyncTrigger } from "@/generated/prisma/client";
import { syncClients } from "@/src/features/clients/client-service";

async function main() {
  try {
    const result = await syncClients(1, { trigger: ClientSyncTrigger.AUTOMATIC });
    console.log("Client sync finished:", result);
    process.exit(0);
  } catch (error) {
    console.error("Client sync failed:", error);
    process.exit(1);
  }
}

void main();
