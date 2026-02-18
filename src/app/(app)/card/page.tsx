"use client";

import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import Input from "@/src/components/Input";
import { API_ROUTES, UI_ROUTES } from "@/src/constants/routes";
import { Balances } from "@/src/features/balances/balances";
import { ArrowFatLeftIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CardBalancePage() {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [cardBalanceInput, setCardBalanceInput] = useState<number | null>(
    balances?.cardBalance.total || null,
  );
  const router = useRouter();

  useEffect(() => {
    async function fetchBalances() {
      const res = await fetch(API_ROUTES.BALANCES);
      const balances = await res.json();
      setBalances(balances);
      setCardBalanceInput(balances.cardBalance.total);
    }

    fetchBalances();
  }, []);

  const handleSubmit = async () => {
    await fetch(API_ROUTES.BALANCES_CARD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total: cardBalanceInput }),
    });

    const res = await fetch(API_ROUTES.BALANCES);
    const updatedBalances = await res.json();
    setBalances(updatedBalances);
    router.push(UI_ROUTES.HOME);
  };

  return (
    <div>
      <div className="w-full">
        <div className="absolute top-4 left-4">
          <ArrowFatLeftIcon
            onClick={() => router.push(UI_ROUTES.HOME)}
            weight="fill"
            size={36}
          />
        </div>

        {balances && (
          <div className="flex flex-col items-center gap-12 mt-32">
            <Card className="w-full text-center">
              <b>I currently have </b>
              <br />
              <Input
                autoFocus={true}
                value={cardBalanceInput?.toString() || ""}
                type="number"
                placeholder="Lemme see that money"
                onChange={(value) =>
                  setCardBalanceInput(parseFloat(value) || 0)
                }
                className="text-center"
              />
              <br />
              <b> on my card.</b>
            </Card>

            <Button color="lime" className="w-1/4" onClick={handleSubmit}>
              <b>save</b>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
