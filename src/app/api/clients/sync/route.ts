import { syncBodySchema } from "@/src/features/clients/client-sync-schema";
import { syncClients } from "@/src/features/clients/client-service";
import { errorResponse, requireBusinessId } from "@/src/features/auth/session";
import { parseRequestBody } from "@/src/utils/validation";

const ACUITY_SYNC_BUSINESS_ID = 1;

export async function POST(request: Request): Promise<Response> {
  try {
    const businessId = await requireBusinessId();

    if (businessId !== ACUITY_SYNC_BUSINESS_ID) {
      return new Response(
        JSON.stringify({ error: "Client sync is not available for this business yet" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const parsed = await parseRequestBody(request, syncBodySchema);
    if (!parsed.success) return parsed.response;
    const { trigger } = parsed.data;
    const result = await syncClients(businessId, { trigger });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to sync clients:", error);
    return errorResponse(error);
  }
}
