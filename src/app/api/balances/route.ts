import { getBalances } from "@/src/features/balances/balance-service";
import { errorResponse, requireBusinessId } from "@/src/features/auth/session";

export async function GET(): Promise<Response> {
  try {
    const businessId = await requireBusinessId();
    const balances = await getBalances(businessId);
    return new Response(JSON.stringify(balances), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
