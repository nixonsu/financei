import "dotenv/config";

import { ClientSyncTrigger } from "@/generated/prisma/client";
import { syncClients } from "@/src/features/clients/client-service";

async function main() {
  console.log("Running Acuity client sync for primary business (id=1) only.");
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
