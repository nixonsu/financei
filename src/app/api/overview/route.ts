import { getOverview } from "@/src/features/overview/overview-service";
import { endOfUtcDay, startOfUtcDay } from "@/src/utils/query-date-range";

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
    const overview = await getOverview(1, fromDate, toDate);
    return new Response(JSON.stringify(overview), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch overview";
    console.error("Failed to fetch overview:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
