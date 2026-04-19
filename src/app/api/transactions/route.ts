import { deleteTransactionSchema, updateTransactionSchema } from "@/src/features/transactions/transaction-schemas";
import { deleteTransaction, getTransactions, updateTransaction } from "@/src/features/transactions/transaction-service";
import { errorResponse, requireBusinessId } from "@/src/features/auth/session";
import { prisma } from "@/src/lib/prisma";
import { endOfUtcDay, startOfUtcDay } from "@/src/utils/query-date-range";
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

  const fromDate = startOfUtcDay(from);
  const toDate = endOfUtcDay(to);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return new Response(
      JSON.stringify({ error: "Invalid date format for 'from' or 'to'" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const businessId = await requireBusinessId();
    const transactions = await getTransactions(businessId, fromDate, toDate);
    return new Response(JSON.stringify(transactions), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return errorResponse(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const businessId = await requireBusinessId();
    const parsed = await parseRequestBody(request, updateTransactionSchema);
    if (!parsed.success) return parsed.response;
    const { id, cardAmount, cashAmount, date, notes } = parsed.data;

    // Ownership check
    const tx = await prisma.transaction.findUnique({ where: { id }, select: { businessId: true } });
    if (!tx || tx.businessId !== businessId) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updated = await updateTransaction(id, { date, notes, cardAmount, cashAmount });

    return new Response(
      JSON.stringify({ message: "Transaction updated", transaction: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const businessId = await requireBusinessId();
    const parsed = await parseRequestBody(request, deleteTransactionSchema);
    if (!parsed.success) return parsed.response;

    // Ownership check
    const tx = await prisma.transaction.findUnique({ where: { id: parsed.data.id }, select: { businessId: true } });
    if (!tx || tx.businessId !== businessId) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await deleteTransaction(parsed.data.id);

    return new Response(
      JSON.stringify({ message: "Transaction deleted" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return errorResponse(error);
  }
}
