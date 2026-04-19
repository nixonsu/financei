import { getClients } from "@/src/features/clients/client-service";
import { errorResponse, requireBusinessId } from "@/src/features/auth/session";

export async function GET(): Promise<Response> {
  try {
    const businessId = await requireBusinessId();
    const clients = await getClients(businessId);
    return new Response(JSON.stringify(clients), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    return errorResponse(error);
  }
}
