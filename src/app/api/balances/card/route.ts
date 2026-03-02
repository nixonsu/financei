import { updateCardBalance } from "@/src/features/balances/balance-service";

export async function POST(request: Request): Promise<Response> {
  try {
    const { total } = await request.json();

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
