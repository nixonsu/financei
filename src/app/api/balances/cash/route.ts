import { updateCashBalance } from "@/src/features/balances/balance-service";
import { parseRequestBody } from "@/src/utils/validation";
import { z } from "zod";

const cashBalanceSchema = z.object({
  fives: z.number().int().min(0),
  tens: z.number().int().min(0),
  twenties: z.number().int().min(0),
  fifties: z.number().int().min(0),
  hundreds: z.number().int().min(0),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseRequestBody(request, cashBalanceSchema);
    if (!parsed.success) return parsed.response;
    const { fives, tens, twenties, fifties, hundreds } = parsed.data;

    await updateCashBalance(1, fives, tens, twenties, fifties, hundreds);

    return new Response(JSON.stringify({ message: "Cash balance updated" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update cash balance";
    console.error("Failed to update cash balance:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
