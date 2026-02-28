export interface CashBalances {
  fives: number;
  tens: number;
  twenties: number;
  fifties: number;
  hundreds: number;
}

export const calculateCashTotal = (cashBalances: CashBalances): number => {
  if (!cashBalances) return 0;
  const { fives, tens, twenties, fifties, hundreds } = cashBalances;
  return fives * 5 + tens * 10 + twenties * 20 + fifties * 50 + hundreds * 100;
};
