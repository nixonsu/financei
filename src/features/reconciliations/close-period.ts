import type { ReconciliationRow } from "@/src/features/reconciliations/reconciliation-types";

/** Day after opening anchor 2023-03-31 — first closable period start. */
export const FIRST_CLOSE_START = "2023-04-01";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** `YYYY-MM-DD` for the last calendar day of the current month (local). */
export function lastDayOfCurrentMonthLocal(): string {
  const n = new Date();
  const d = new Date(n.getFullYear(), n.getMonth() + 1, 0);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Next calendar day after `YYYY-MM-DD` (local). */
export function dayAfterYmd(ymd: string): string {
  const [y, m, day] = ymd.slice(0, 10).split("-").map(Number);
  const dt = new Date(y, m - 1, day);
  dt.setDate(dt.getDate() + 1);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

/**
 * `reconciliations` must be ordered by `endPeriod` descending (API default).
 * Returns `null` when there is no valid period (e.g. already closed through month-end).
 */
export function getClosePeriodDates(
  reconciliations: ReconciliationRow[],
): { startPeriod: string; endPeriod: string } | null {
  const endPeriod = lastDayOfCurrentMonthLocal();
  const startPeriod =
    reconciliations.length === 0
      ? FIRST_CLOSE_START
      : dayAfterYmd(reconciliations[0].endPeriod);

  if (startPeriod > endPeriod) return null;
  return { startPeriod, endPeriod };
}
