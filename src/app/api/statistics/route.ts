import { getPeriodStatistics } from "@/src/features/overview/overview-service";
import { errorResponse, requireBusinessId } from "@/src/features/auth/session";
import { endOfUtcDay, startOfUtcDay } from "@/src/utils/query-date-range";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return new Response(
      JSON.stringify({
        error: "Both 'from' and 'to' query parameters are required",
      }),
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
    const statistics = await getPeriodStatistics(businessId, fromDate, toDate);
    return new Response(JSON.stringify(statistics), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch statistics:", error);
    return errorResponse(error);
  }
}
