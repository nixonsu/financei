/** Preset range for list/overview filters; UI maps these to `from` / `to` ISO dates for APIs. */
export type Period = "1m" | "3m" | "1y" | "all" | "custom";

export const TRANSACTIONS_PERIODS: { value: Period; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "ALL" },
  { value: "custom", label: "CST" },
];

const PERIOD_DAYS: Record<string, number> = {
  "1m": 30,
  "3m": 90,
  "1y": 365,
};

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

/** Resolve preset or custom period to inclusive ISO date strings for API query params. */
export function periodToDateRange(
  period: Period,
  customFrom: string,
  customTo: string,
): { from: string; to: string } {
  if (period === "custom") return { from: customFrom, to: customTo };
  const to = new Date();
  const from = new Date();
  const days = PERIOD_DAYS[period];
  if (days) from.setDate(from.getDate() - days);
  else from.setFullYear(2000);
  return { from: toISODate(from), to: toISODate(to) };
}

/** Statistics page presets (calendar-based, except custom = FY range from inputs). */
export type StatisticsPeriod =
  | "thisMonth"
  | "lastMonth"
  | "ytd"
  | "all"
  | "custom";

export const STATISTICS_PERIODS: {
  value: StatisticsPeriod;
  label: string;
  title: string;
}[] = [
  { value: "thisMonth", label: "1M", title: "This month" },
  { value: "lastMonth", label: "2M", title: "Last month" },
  { value: "ytd", label: "1Y", title: "Year to date (calendar year)" },
  { value: "all", label: "ALL", title: "All time" },
  { value: "custom", label: "CST", title: "Custom" },
];

export function statisticsPeriodToDateRange(
  period: StatisticsPeriod,
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
