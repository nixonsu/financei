"use client";

import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import CurrencyInput from "@/src/components/CurrencyInput";
import { showToast } from "@/src/components/Toast";
import { API_ROUTES, UI_ROUTES } from "@/src/constants/routes";
import { Balances } from "@/src/features/balances/balances";
import { ArrowFatLeftIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CardBalancePage() {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [cardBalanceInput, setCardBalanceInput] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    async function fetchBalances() {
      const res = await fetch(API_ROUTES.BALANCES);
      const balances = await res.json();
      setBalances(balances);
      setCardBalanceInput(balances.cardBalance.total.toString());
    }

    fetchBalances();
  }, []);

  const handleSubmit = async () => {
    const total = parseFloat(cardBalanceInput) || 0;
    const res = await fetch(API_ROUTES.BALANCES_CARD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total }),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Failed to update card balance", "error");
      return;
    }

    const balancesRes = await fetch(API_ROUTES.BALANCES);
    const updatedBalances = await balancesRes.json();
    setBalances(updatedBalances);
    showToast("Card balance updated");
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

        {balances && cardBalanceInput !== null && (
          <div className="flex flex-col items-center gap-8 mt-20 px-6 pb-8">
            <Card className="w-full! max-w-sm flex flex-col items-center gap-4 py-6!">
              <b>I currently have</b>

              <CurrencyInput
                autoFocus
                value={cardBalanceInput}
                onChange={setCardBalanceInput}
                className="w-32! text-center"
              />

              <b>on my card.</b>

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
