import { getCurrentBalances } from "@/src/features/balances/balance-service";
import { errorResponse, requireBusinessId } from "@/src/features/auth/session";

export async function GET(): Promise<Response> {
  try {
    const businessId = await requireBusinessId();
    const summary = await getCurrentBalances(businessId);
    return new Response(JSON.stringify(summary), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch balance summary:", error);
    return errorResponse(error);
  }
}
