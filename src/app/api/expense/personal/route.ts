import { baseTransactionSchema } from "@/src/features/transactions/transaction-schemas";
import { createPersonalExpense } from "@/src/features/transactions/transaction-service";
import { parseRequestBody } from "@/src/utils/validation";

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseRequestBody(request, baseTransactionSchema);
    if (!parsed.success) return parsed.response;
    const { cardAmount, cashAmount, date, notes } = parsed.data;

    await createPersonalExpense(1, date, notes, cardAmount, cashAmount);

    return new Response(JSON.stringify({ message: "Personal expense added" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add personal expense";
    console.error("Failed to add personal expense:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
