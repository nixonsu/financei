import { syncBodySchema } from "@/src/features/clients/client-sync-schema";
import { syncClients } from "@/src/features/clients/client-service";
import { parseRequestBody } from "@/src/utils/validation";

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseRequestBody(request, syncBodySchema);
    if (!parsed.success) return parsed.response;
    const { trigger } = parsed.data;
    const result = await syncClients(1, { trigger });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync clients";
    console.error("Failed to sync clients:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
