import { ClientSyncTrigger } from "@/generated/prisma/client";
import { z } from "zod";

const clientSyncTriggers = [
  ClientSyncTrigger.AUTOMATIC,
  ClientSyncTrigger.MANUAL,
] as const;

export const syncBodySchema = z.object({
  trigger: z.enum(clientSyncTriggers).optional(),
});

export type SyncBody = z.infer<typeof syncBodySchema>;
