import { conversionSchema } from "@/src/features/transactions/transaction-schemas";
import { createCardToCashConversion } from "@/src/features/transactions/transaction-service";
import { parseRequestBody } from "@/src/utils/validation";

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseRequestBody(request, conversionSchema);
    if (!parsed.success) return parsed.response;
    const { amount, date, notes } = parsed.data;

    await createCardToCashConversion(1, date, notes, amount);

    return new Response(
      JSON.stringify({ message: "Card to cash conversion added" }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add conversion";
    console.error("Failed to add card-to-cash conversion:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
