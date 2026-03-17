import { z } from "zod";

const cardAmount = z
  .number({ error: "Card amount must be a number" })
  .min(0, "Card amount cannot be negative");

const cashAmount = z
  .number({ error: "Cash amount must be a number" })
  .min(0, "Cash amount cannot be negative");

const date = z.iso.date({ error: "Please select a date" });

const notes = z.string();

const hasAmount = (data: { cardAmount: number; cashAmount: number }) =>
  data.cardAmount > 0 || data.cashAmount > 0;

const HAS_AMOUNT_MESSAGE = "Please enter a card or cash amount";

export const baseTransactionSchema = z
  .object({ cardAmount, cashAmount, date, notes })
  .refine(hasAmount, { message: HAS_AMOUNT_MESSAGE });

export const conversionSchema = z.object({
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  date,
  notes,
});

export const updateTransactionSchema = z
  .object({
    id: z.number({ error: "Transaction ID is required" }),
    cardAmount,
    cashAmount,
    date,
    notes,
  })
  .refine(hasAmount, { message: HAS_AMOUNT_MESSAGE });

export const saleTransactionSchema = z
  .object({
    cardAmount,
    cashAmount,
    date,
    notes,
    clientId: z.number({ error: "Please select a client" }),
  })
  .refine(hasAmount, { message: HAS_AMOUNT_MESSAGE });
