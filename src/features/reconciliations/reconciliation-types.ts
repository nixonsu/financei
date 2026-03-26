export interface ReconciliationRow {
  id: number;
  startPeriod: string;
  endPeriod: string;
  expectedCash: number;
  expectedCard: number;
  actualCash: number;
  actualCard: number;
}

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return Number(v);
  return Number(v);
}

export function normalizeReconciliation(
  r: Record<string, unknown>,
): ReconciliationRow {
  return {
    id: Number(r.id),
    startPeriod: String(r.startPeriod),
    endPeriod: String(r.endPeriod),
    expectedCash: num(r.expectedCash),
    expectedCard: num(r.expectedCard),
    actualCash: num(r.actualCash),
    actualCard: num(r.actualCard),
  };
}

export function normalizeReconciliationList(raw: unknown): ReconciliationRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) =>
    normalizeReconciliation(item as Record<string, unknown>),
  );
}
