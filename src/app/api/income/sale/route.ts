import { saleTransactionSchema } from "@/src/features/transactions/transaction-schemas";
import { createSale } from "@/src/features/transactions/transaction-service";
import { parseRequestBody } from "@/src/utils/validation";

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseRequestBody(request, saleTransactionSchema);
    if (!parsed.success) return parsed.response;
    const { cardAmount, cashAmount, date, notes, clientId } = parsed.data;

    await createSale(1, clientId, date, notes, cardAmount, cashAmount);

    return new Response(JSON.stringify({ message: "Sale added" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add sale";
    console.error("Failed to add sale:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
