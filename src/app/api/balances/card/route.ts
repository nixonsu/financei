import { updateCardBalance } from "@/src/features/balances/balance-service";

export async function POST(request: Request): Promise<Response> {
  const { total } = await request.json();

  await updateCardBalance(1, total);

  return new Response(null, {
    status: 201,
    headers: { "Content-Type": "text/plain" },
  });
}
