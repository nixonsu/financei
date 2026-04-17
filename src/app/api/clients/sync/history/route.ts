import { getClientSyncAttempts } from "@/src/features/clients/client-service";

export async function GET(): Promise<Response> {
  const attempts = await getClientSyncAttempts(1);

  return new Response(JSON.stringify({ attempts }), {
    headers: { "Content-Type": "application/json" },
  });
}
