"use client";

import { User } from "@/generated/prisma/client";
import Card from "@/src/components/Card";
import { API_ROUTES } from "@/src/constants/routes";
import { Balances } from "@/src/features/balances/balances";
import { CaretRightIcon } from "@phosphor-icons/react/dist/icons/CaretRight";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<Balances | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch(API_ROUTES.ME);
      const user = await res.json();
      setUser(user);
    }

    async function fetchBalances() {
      const res = await fetch(API_ROUTES.BALANCES);
      const balances = await res.json();
      setBalances(balances);
    }

    fetchUser();
    fetchBalances();
  }, []);

  const handleCardBalanceClick = () => {
    router.push("/card");
  };

  const handleCashBalanceClick = () => {
    router.push("/cash");
  };

  return (
    <div>
      <div>
        {user && <h1>Hello, {user.firstName}.</h1>}

        {balances && (
          <div className="flex flex-col items-center gap-16 mt-16">
            <Card
              className="flex items-center justify-between gap-4 cursor-pointer"
              onClick={handleCardBalanceClick}
            >
              <p>Card Balance: ${balances.cardBalance.total}</p>

              <CaretRightIcon className="w-4 h-4" weight="fill" size={32} />
            </Card>
            <Card
              className="flex items-center justify-between gap-4 cursor-pointer"
              onClick={handleCashBalanceClick}
            >
              <p>Cash Balance: ${balances.cashBalance.total}</p>

              <CaretRightIcon className="w-4 h-4" weight="fill" size={32} />
            </Card>
            <Card>
              <p>Variance: ${balances.variance}</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
