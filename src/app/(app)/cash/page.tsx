"use client";

import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import Input from "@/src/components/Input";
import { showToast } from "@/src/components/Toast";
import { API_ROUTES, UI_ROUTES } from "@/src/constants/routes";
import { Balances } from "@/src/features/balances/balances";
import { calculateCashTotal, CashBalances } from "@/src/utils/calculations";
import { ArrowFatLeftIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CardBalancePage() {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [cashBalanceInput, setCashBalanceInput] = useState<CashBalances>({
    fives: 0,
    tens: 0,
    twenties: 0,
    fifties: 0,
    hundreds: 0,
  });
  const router = useRouter();

  useEffect(() => {
    async function fetchBalances() {
      const res = await fetch(API_ROUTES.BALANCES);
      const balances: Balances = await res.json();
      setBalances(balances);
      setCashBalanceInput({
        fives: balances.cashBalance.fives,
        tens: balances.cashBalance.tens,
        twenties: balances.cashBalance.twenties,
        fifties: balances.cashBalance.fifties,
        hundreds: balances.cashBalance.hundreds,
      });
    }

    fetchBalances();
  }, []);

  const handleSubmit = async () => {
    const { fives, tens, twenties, fifties, hundreds } = cashBalanceInput || {};

    const res = await fetch(API_ROUTES.BALANCES_CASH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fives, tens, twenties, fifties, hundreds }),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Failed to update cash balance", "error");
      return;
    }

    const balancesRes = await fetch(API_ROUTES.BALANCES);
    const updatedBalances = await balancesRes.json();
    setBalances(updatedBalances);
    showToast("Cash balance updated");
    router.push(UI_ROUTES.HOME);
  };

  return (
    <div>
      <div className="w-full">
        <div className="absolute top-4 left-4 cursor-pointer">
          <ArrowFatLeftIcon
            onClick={() => router.push(UI_ROUTES.HOME)}
            weight="fill"
            size={36}
          />
        </div>

        {balances && cashBalanceInput && (
          <div className="flex flex-col items-center gap-8 mt-20 px-6 pb-8">
            <Card className="w-full! max-w-sm flex flex-col items-center gap-4 py-6!">
              <b>I currently have</b>

              <div className="flex flex-col gap-3 mt-4 items-center">
                {[
                  { label: "$5", key: "fives" as const },
                  { label: "$10", key: "tens" as const },
                  { label: "$20", key: "twenties" as const },
                  { label: "$50", key: "fifties" as const },
                  { label: "$100", key: "hundreds" as const },
                ].map(({ label, key }, i) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 justify-center"
                  >
                    <span className="text-lg font-bold whitespace-nowrap w-14 text-right">
                      {label} x
                    </span>
                    <Input
                      autoFocus={i === 0}
                      value={cashBalanceInput[key].toString()}
                      type="number"
                      onChange={(value) => {
                        const num = parseInt(value) || 0;
                        const clamped = Math.max(0, Math.min(1000, num));
                        setCashBalanceInput((prev) => ({
                          ...prev,
                          [key]: clamped,
                        }));
                      }}
                      className="w-24! text-center"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col items-center gap-1">
                <b>Totalling:</b>
                <span className="text-2xl font-bold">
                  ${calculateCashTotal(cashBalanceInput)}
                </span>
                <b>in cash.</b>
              </div>

              <Button
                color="lime"
                className="w-full mt-4"
                onClick={handleSubmit}
              >
                <b>save</b>
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
