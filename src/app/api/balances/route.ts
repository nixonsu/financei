import { getBalances } from "@/src/features/balances/balance-service";

export async function GET(): Promise<Response> {
  const balances = await getBalances(1);

  return new Response(JSON.stringify(balances), {
    headers: { "Content-Type": "application/json" },
  });
}
