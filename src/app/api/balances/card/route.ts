import { updateCardBalance } from "@/src/features/balances/balance-service";
import { errorResponse, requireBusinessId } from "@/src/features/auth/session";
import { parseRequestBody } from "@/src/utils/validation";
import { z } from "zod";

const cardBalanceSchema = z.object({
  total: z.number().min(0),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const businessId = await requireBusinessId();
    const parsed = await parseRequestBody(request, cardBalanceSchema);
    if (!parsed.success) return parsed.response;
    const { total } = parsed.data;

    await updateCardBalance(businessId, total);

    return new Response(JSON.stringify({ message: "Card balance updated" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to update card balance:", error);
    return errorResponse(error);
  }
}
