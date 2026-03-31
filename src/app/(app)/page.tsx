"use client";

import { User } from "@/generated/prisma/client";
import Button from "@/src/components/Button";
import Dialog from "@/src/components/Dialog";
import FetchContent from "@/src/components/FetchContent";
import { showToast } from "@/src/components/Toast";
import { API_ROUTES, UI_ROUTES } from "@/src/constants/routes";
import type { BalanceSummary } from "@/src/features/overview/overview-service";
import { getClosePeriodDates } from "@/src/features/reconciliations/close-period";
import {
  normalizeReconciliationList,
  type ReconciliationRow,
} from "@/src/features/reconciliations/reconciliation-types";
import { useFetch } from "@/src/hooks/useFetch";
import {
  getFollowUpMessage,
  getTimeOfDayMessage as getGreetingMessage,
  getTimeOfDay,
} from "@/src/utils/messages";
import { CaretRightIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

function fmt(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatYmdAu(ymd: string): string {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function periodVariance(r: ReconciliationRow): number {
  return r.actualCash + r.actualCard - (r.expectedCash + r.expectedCard);
}

function varianceClass(v: number): string {
  if (v >= 0) return "text-green-700";
  if (Math.abs(v) < 10) return "text-yellow-700";
  return "text-red-700";
}

export default function Home() {
  const router = useRouter();
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState("");
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [submittingClose, setSubmittingClose] = useState(false);
  /** `undefined` = loading; `null` = failed; otherwise loaded user */
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const {
    data: balanceSummary,
    loading: balanceLoading,
    refetch: refetchBalance,
  } = useFetch<BalanceSummary>(API_ROUTES.BALANCE_SUMMARY);

  const {
    data: reconciliationsRaw,
    loading: reconciliationsLoading,
    refetch: refetchReconciliations,
  } = useFetch<unknown>(API_ROUTES.RECONCILIATIONS);

  const reconciliations = useMemo(
    () => normalizeReconciliationList(reconciliationsRaw),
    [reconciliationsRaw],
  );

  const closePeriod = useMemo(
    () => getClosePeriodDates(reconciliations),
    [reconciliations],
  );

  const canOfferClose =
    Boolean(balanceSummary) &&
    !balanceLoading &&
    !reconciliationsLoading &&
    closePeriod !== null;

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(API_ROUTES.ME);
        setUser(await res.json());
      } catch {
        setUser(null);
      }
    }
    loadUser();
  }, []);

  /* Random copy must not run during SSR (hydration mismatch). Only when user is loaded. */
  useLayoutEffect(() => {
    if (!user) return;
    const tod = getTimeOfDay();
    const name = user.firstName.trim() || "there";
    setGreetingMessage(getGreetingMessage(tod, name));
    setFollowUpMessage(getFollowUpMessage(tod));
  }, [user]);

  const openCloseDialog = () => {
    if (!canOfferClose) return;
    setCloseDialogOpen(true);
  };

  const confirmCloseMonth = async () => {
    if (!balanceSummary || !closePeriod) return;
    setSubmittingClose(true);
    try {
      const res = await fetch(API_ROUTES.RECONCILIATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startPeriod: closePeriod.startPeriod,
          endPeriod: closePeriod.endPeriod,
          expectedCash: balanceSummary.expectedCashBalance,
          expectedCard: balanceSummary.expectedCardBalance,
          actualCash: balanceSummary.actualCashBalance,
          actualCard: balanceSummary.actualCardBalance,
        }),
      });
      const body = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        showToast(body.error ?? "Failed to close month", "error");
        return;
      }

      setCloseDialogOpen(false);
      showToast(body.message ?? "Nice! You've closed your balance!");
      await Promise.all([refetchBalance(), refetchReconciliations()]);
    } catch {
      showToast("Failed to close month", "error");
    } finally {
      setSubmittingClose(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {user ? (
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold leading-tight">
            {greetingMessage || "\u00a0"}
          </h1>
          {followUpMessage ? (
            <p className="text-sm text-gray-500 leading-snug">
              {followUpMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button
          onClick={openCloseDialog}
          disabled={!canOfferClose || submittingClose}
          color="yellow"
        >
          End of month close
        </Button>
      </div>

      <Dialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        title={
          closePeriod ? (
            <p>
              Close {formatYmdAu(closePeriod.startPeriod)} to
              <br />
              {formatYmdAu(closePeriod.endPeriod)}?
            </p>
          ) : (
            "You can’t close this period right now."
          )
        }
        confirmLabel="Close month"
        pendingConfirmLabel="Closing…"
        onConfirm={() => void confirmCloseMonth()}
        confirmDisabled={!closePeriod}
        isPending={submittingClose}
      />

      <FetchContent data={balanceSummary} loading={balanceLoading}>
        {(data) => {
          const expectedTotalBalance =
            data.expectedCardBalance + data.expectedCashBalance;
          const actualTotalBalance =
            data.actualCardBalance + data.actualCashBalance;

          return (
            <section>
              <p className="text-sm font-bold italic text-gray-600 mb-2">
                Balances
              </p>
              <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="grid grid-cols-3 px-4 py-2.5 border-b-2 border-black bg-gray-50">
                  <span />
                  <span className="text-xs font-bold text-center uppercase tracking-wide">
                    Expected
                  </span>
                  <span className="text-xs font-bold text-center uppercase tracking-wide">
                    Actual
                  </span>
                </div>

                <div className="grid grid-cols-3 items-center px-4 py-3 border-b-2 border-black">
                  <span className="text-sm font-semibold">Card</span>
                  <span className="text-sm font-medium text-center">
                    {fmt(data.expectedCardBalance)}
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push(UI_ROUTES.CARD)}
                    className="cursor-pointer flex items-center justify-center gap-1 text-sm font-medium text-center hover:text-cyan-700 transition-colors"
                  >
                    {fmt(data.actualCardBalance)}
                    <CaretRightIcon size={14} weight="bold" />
                  </button>
                </div>

                <div className="grid grid-cols-3 items-center px-4 py-3 border-b-2 border-black">
                  <span className="text-sm font-semibold">Cash</span>
                  <span className="text-sm font-medium text-center">
                    {fmt(data.expectedCashBalance)}
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push(UI_ROUTES.CASH)}
                    className="cursor-pointer flex items-center justify-center gap-1 text-sm font-medium text-center hover:text-cyan-700 transition-colors"
                  >
                    {fmt(data.actualCashBalance)}
                    <CaretRightIcon size={14} weight="bold" />
                  </button>
                </div>

                <div className="grid grid-cols-3 items-center px-4 py-3 border-b-2 border-black bg-gray-50">
                  <span className="text-sm font-bold">Total</span>
                  <span className="text-sm font-bold text-center">
                    {fmt(expectedTotalBalance)}
                  </span>
                  <span className="text-sm font-bold text-center">
                    {fmt(actualTotalBalance)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold">Variance</span>
                  <span
                    className={`text-base font-bold ${
                      data.variance >= 0
                        ? "text-green-600"
                        : Math.abs(data.variance) < 10
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {data.variance >= 0 ? "+" : "-"}
                    {fmt(data.variance)}
                  </span>
                </div>
              </div>
            </section>
          );
        }}
      </FetchContent>

      <FetchContent
        data={reconciliationsRaw === null ? null : reconciliations}
        loading={reconciliationsLoading}
        hasData={(list) => list.length > 0}
        emptyMessage="No month closes recorded yet."
      >
        {(list) => (
          <section>
            <p className="text-sm font-bold italic text-gray-600 mb-2">
              Recent closes
            </p>
            <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4 py-2.5 border-b-2 border-black bg-gray-50 text-xs font-bold uppercase tracking-wide">
                <span>Period</span>
                <span className="text-right">Variance</span>
              </div>
              {list.map((r) => {
                const v = periodVariance(r);
                return (
                  <div
                    key={r.id}
                    className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 items-center px-4 py-3 border-b-2 border-black last:border-b-0"
                  >
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold">
                        {formatYmdAu(r.startPeriod)} –{" "}
                        {formatYmdAu(r.endPeriod)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        Card {fmt(r.expectedCard)} | {fmt(r.actualCard)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        Cash {fmt(r.expectedCash)} | {fmt(r.actualCash)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold text-right tabular-nums ${varianceClass(v)}`}
                    >
                      {v >= 0 ? "+" : "-"}
                      {fmt(v)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </FetchContent>
    </div>
  );
}
