export interface Balances {
  cardBalance: {
    total: number;
  };
  cashBalance: {
    fives: number;
    tens: number;
    twenties: number;
    fifties: number;
    hundreds: number;
    total: number;
  };
  variance: number;
}
