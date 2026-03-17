import { updateCardBalance } from "@/src/features/balances/balance-service";
import { parseRequestBody } from "@/src/utils/validation";
import { z } from "zod";

const cardBalanceSchema = z.object({
  total: z.number().min(0),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseRequestBody(request, cardBalanceSchema);
    if (!parsed.success) return parsed.response;
    const { total } = parsed.data;

    await updateCardBalance(1, total);

    return new Response(JSON.stringify({ message: "Card balance updated" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update card balance";
    console.error("Failed to update card balance:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
