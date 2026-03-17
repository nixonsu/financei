import { updateTransactionSchema } from "@/src/features/transactions/transaction-schemas";
import { getTransactions, updateTransaction } from "@/src/features/transactions/transaction-service";
import { parseRequestBody } from "@/src/utils/validation";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return new Response(
      JSON.stringify({ error: "Both 'from' and 'to' query parameters are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return new Response(
      JSON.stringify({ error: "Invalid date format for 'from' or 'to'" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const transactions = await getTransactions(1, fromDate, toDate);

    return new Response(JSON.stringify(transactions), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch transactions";
    console.error("Failed to fetch transactions:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const parsed = await parseRequestBody(request, updateTransactionSchema);
    if (!parsed.success) return parsed.response;
    const { id, cardAmount, cashAmount, date, notes } = parsed.data;

    const updated = await updateTransaction(id, { date, notes, cardAmount, cashAmount });

    return new Response(
      JSON.stringify({ message: "Transaction updated", transaction: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update transaction";
    console.error("Failed to update transaction:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
