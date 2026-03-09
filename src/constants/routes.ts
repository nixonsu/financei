export const API_ROUTES = {
  ME: "/api/users/me",
  BALANCES: "/api/balances",
  BALANCES_CARD: "/api/balances/card",
  BALANCES_CASH: "/api/balances/cash",
  CLIENTS: "/api/clients",
  CLIENTS_SYNC: "/api/clients/sync",
  SALE: "/api/sale",
} as const;

export const UI_ROUTES = {
  HOME: "/",
  CARD: "/card",
  CASH: "/cash",
  ADD_INCOME: "/add-income",
  ADD_EXPENSE: "/add-expense",
  ADD_CONVERT: "/add-convert",
  TRANSACTIONS: "/transactions",
  CLIENTS: "/clients",
  SETTINGS: "/settings",
} as const;
