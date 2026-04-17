export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseIsoYmdLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Compact en-AU range for filter UI (calendar dates from ISO strings). */
export function formatIsoRangeEnAu(from: string, to: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const a = parseIsoYmdLocal(from).toLocaleDateString("en-AU", opts);
  const b = parseIsoYmdLocal(to).toLocaleDateString("en-AU", opts);
  return `${a} – ${b}`;
}

/** Calendar-based preset keys for date filters; custom uses FY defaults from inputs. */
export type Period =
  | "thisMonth"
  | "lastMonth"
  | "ytd"
  | "all"
  | "custom";

export const PERIODS: {
  value: Period;
  label: string;
  title: string;
}[] = [
  { value: "thisMonth", label: "1M", title: "This month" },
  { value: "lastMonth", label: "2M", title: "Last month" },
  { value: "ytd", label: "1Y", title: "Year to date (calendar year)" },
  { value: "all", label: "ALL", title: "All time" },
  { value: "custom", label: "CST", title: "Custom" },
];

export function periodToDateRange(
  period: Period,
  customFrom: string,
  customTo: string,
): { from: string; to: string } {
  if (period === "custom") return { from: customFrom, to: customTo };

  const to = new Date();

  if (period === "all") {
    const from = new Date();
    from.setFullYear(2000);
    return { from: toISODate(from), to: toISODate(to) };
  }

  const y = to.getUTCFullYear();
  const m = to.getUTCMonth();

  if (period === "thisMonth") {
    const from = new Date(Date.UTC(y, m, 1));
    return { from: toISODate(from), to: toISODate(to) };
  }

  if (period === "lastMonth") {
    const prevMonth = m === 0 ? 11 : m - 1;
    const prevYear = m === 0 ? y - 1 : y;
    const from = new Date(Date.UTC(prevYear, prevMonth, 1));
    const endPrev = new Date(Date.UTC(y, m, 0));
    return { from: toISODate(from), to: toISODate(endPrev) };
  }

  /* ytd — calendar year to date, UTC-aligned with toISODate(to) */
  const from = new Date(Date.UTC(y, 0, 1));
  return { from: toISODate(from), to: toISODate(to) };
}

export function getDefaultFinancialYear(): { from: string; to: string } {
  const today = new Date();
  const year =
    today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
  return {
    from: `${year}-07-01`,
    to: `${year + 1}-06-30`,
  };
}
