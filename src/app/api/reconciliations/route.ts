import { reconciliationSchema } from "@/src/app/api/reconciliations/schema";
import {
  createReconciliation,
  getReconciliations,
} from "@/src/features/reconciliations/reconciliation-service";
import { errorResponse, requireBusinessId } from "@/src/features/auth/session";
import { parseRequestBody } from "@/src/utils/validation";

export async function GET(): Promise<Response> {
  try {
    const businessId = await requireBusinessId();
    const reconciliations = await getReconciliations(businessId);
    return new Response(JSON.stringify(reconciliations), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to get reconciliations:", error);
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const businessId = await requireBusinessId();
    const parsed = await parseRequestBody(request, reconciliationSchema);
    if (!parsed.success) return parsed.response;
    const {
      startPeriod,
      endPeriod,
      expectedCash,
      expectedCard,
      actualCash,
      actualCard,
    } = parsed.data;

    await createReconciliation(
      businessId,
      new Date(startPeriod),
      new Date(endPeriod),
      expectedCash,
      expectedCard,
      actualCash,
      actualCard,
    );
    return new Response(
      JSON.stringify({ message: "Nice! You've closed your balance!" }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to create reconciliation:", error);
    return errorResponse(error);
  }
}
