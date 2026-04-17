"use client";

import type { ClientSyncAttempt } from "@/generated/prisma/browser";
import {
  ClientSyncOutcome,
  ClientSyncTrigger,
} from "@/generated/prisma/browser";
import FetchContent from "@/src/components/FetchContent";
import { API_ROUTES, UI_ROUTES } from "@/src/constants/routes";
import { useFetch } from "@/src/hooks/useFetch";
import {
  ArrowFatLeftIcon,
  ClockIcon,
  HandPointingIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type HistoryResponse = { attempts: ClientSyncAttempt[] };

function formatDateHeading(iso: string): string {
  const [year, month, day] = iso.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: Date | string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function triggerLabel(t: ClientSyncTrigger): string {
  return t === ClientSyncTrigger.AUTOMATIC ? "Automatic" : "Manual";
}

function errorsPreview(errors: ClientSyncAttempt["errors"]): string | null {
  if (errors == null) return null;
  try {
    return JSON.stringify(errors, null, 2);
  } catch {
    return String(errors);
  }
}

function groupByDate(
  attempts: ClientSyncAttempt[],
): [string, ClientSyncAttempt[]][] {
  const groups = new Map<string, ClientSyncAttempt[]>();
  for (const row of attempts) {
    const key = new Date(row.attemptedAt as string | Date)
      .toISOString()
      .slice(0, 10);
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }
  return Array.from(groups.entries());
}

export default function ClientSyncHistoryPage() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, loading } = useFetch<HistoryResponse>(
    API_ROUTES.CLIENTS_SYNC_HISTORY,
  );

  const sortedAttempts = useMemo(() => {
    const list = data?.attempts ?? [];
    return [...list].sort(
      (a, b) =>
        new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime(),
    );
  }, [data]);

  const responseForFetch = useMemo(
    (): HistoryResponse | null => (data ? { attempts: sortedAttempts } : null),
    [data, sortedAttempts],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(UI_ROUTES.CLIENTS)}
          className="cursor-pointer"
          aria-label="Back to clients"
        >
          <ArrowFatLeftIcon weight="fill" size={28} />
        </button>
        <h1 className="text-2xl font-bold">Sync history</h1>
      </div>

      {responseForFetch && responseForFetch.attempts.length > 0 && (
        <div className="border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0_#000] flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-bold text-gray-700 shrink-0">
            {responseForFetch.attempts.length === 1
              ? "1 sync attempt"
              : `${responseForFetch.attempts.length} sync attempts`}
          </p>
        </div>
      )}

      <FetchContent
        data={responseForFetch}
        loading={loading}
        hasData={(d) => d.attempts.length > 0}
        emptyMessage="No sync attempts yet."
      >
        {(payload) => {
          const grouped = groupByDate(payload.attempts);
          return (
            <div className="flex flex-col gap-6">
              {grouped.map(([date, dateRows]) => (
                <div key={date}>
                  <p className="text-sm font-bold italic text-gray-600 mb-2">
                    {formatDateHeading(date)}
                  </p>

                  <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    {dateRows.map((row, i) => {
                      const ok = row.outcome === ClientSyncOutcome.SUCCEEDED;
                      const detail = errorsPreview(row.errors);
                      const open = expandedId === row.id;
                      const auto = row.trigger === ClientSyncTrigger.AUTOMATIC;
                      const TriggerIcon = auto ? ClockIcon : HandPointingIcon;
                      const iconBg = auto ? "bg-cyan-100" : "bg-yellow-100";

                      return (
                        <div
                          key={row.id}
                          className={
                            i < dateRows.length - 1
                              ? "border-b-2 border-black"
                              : ""
                          }
                        >
                          <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100">
                            <div
                              className={`shrink-0 w-10 h-10 border-2 border-black flex items-center justify-center ${iconBg}`}
                            >
                              <TriggerIcon size={22} weight="bold" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-base">
                                {triggerLabel(row.trigger)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatTime(row.attemptedAt)}
                              </p>
                            </div>

                            <p
                              className={`font-bold text-sm whitespace-nowrap ${
                                ok ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {ok ? "Succeeded" : "Failed"}
                            </p>
                          </div>

                          {!ok && detail && (
                            <div className="px-4 pb-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedId(open ? null : row.id)
                                }
                                className="cursor-pointer text-xs font-bold border-2 border-black px-2 py-1 bg-white hover:bg-gray-50 active:bg-gray-100 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                              >
                                {open ? "Hide details" : "Error details"}
                              </button>
                              {open && (
                                <pre className="mt-3 max-h-48 overflow-auto border-2 border-black bg-gray-50 p-3 text-[11px] leading-snug text-left font-mono shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                  {detail}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        }}
      </FetchContent>
    </div>
  );
}
