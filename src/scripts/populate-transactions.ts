import "dotenv/config";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import {
  Prisma,
  PrismaClient,
  TransactionCategory,
  TransactionType,
} from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BUSINESS_ID = 1;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// --- Helpers ---

function parseDate(raw: string): Date {
  const parts = raw.trim().split("/");
  if (parts.length !== 3) throw new Error(`Invalid date: "${raw}"`);
  const [day, month, year] = parts.map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function parseAmount(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.trim().replace(/[$,`]/g, "");
  if (cleaned === "" || cleaned === "-") return 0;
  return parseFloat(cleaned) || 0;
}

function isNegativeAmount(raw: string | undefined): boolean {
  if (!raw) return false;
  const cleaned = raw.trim();
  return cleaned.startsWith("-");
}

function buildNotes(...parts: (string | undefined | null)[]): string | null {
  const filtered = parts.map((p) => p?.trim()).filter(Boolean);
  return filtered.length > 0 ? filtered.join(" | ") : null;
}

// --- CSV Column Indices ---

const INC = { DATE: 0, TYPE: 1, CLIENT: 2, NAME: 3, CARD: 4, CASH: 5, NOTES: 6 };
const EXP = { DATE: 11, TYPE: 12, EXPENSE: 13, CARD: 14, CASH: 15, NOTES: 16 };

// --- Types ---

interface TransactionRecord {
  businessId: number;
  type: TransactionType;
  category: TransactionCategory;
  clientId?: number;
  cardAmount: number;
  cashAmount: number;
  notes: string | null;
  occurredAt: Date;
}

// --- Main ---

async function main() {
  const csvPath = process.argv[2] || path.resolve("data/Nail Finances - 23-25.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading CSV: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const { data: rows } = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: true,
  });

  const dataRows = rows.slice(1);

  console.log("Loading clients from database...");
  const clients = await prisma.client.findMany({
    where: { businessId: BUSINESS_ID },
  });

  const clientMap = new Map<string, number>();
  for (const c of clients) {
    clientMap.set(`${c.firstName} ${c.lastName}`, c.id);
  }
  console.log(`Loaded ${clients.length} clients`);

  const transactions: TransactionRecord[] = [];
  const warnings: string[] = [];

  // --- Process Income Rows (columns 0-6) ---

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const csvLine = i + 2;
    const type = row[INC.TYPE]?.trim().toUpperCase();
    const dateRaw = row[INC.DATE]?.trim();

    if (!type || !dateRaw) continue;

    let occurredAt: Date;
    try {
      occurredAt = parseDate(dateRaw);
    } catch {
      warnings.push(`Line ${csvLine}: Skipping income row with invalid date "${dateRaw}"`);
      continue;
    }

    if (type === "SALE") {
      const clientCol = row[INC.CLIENT]?.trim() || "";
      const nameCol = row[INC.NAME]?.trim() || "";
      const cardAmount = parseAmount(row[INC.CARD]);
      const cashAmount = parseAmount(row[INC.CASH]);
      const notesCol = row[INC.NOTES]?.trim() || "";

      let clientId: number | undefined;
      let notes: string | null;

      if (nameCol) {
        const id = clientMap.get(nameCol);
        if (id) {
          clientId = id;
        } else {
          warnings.push(`Line ${csvLine}: Client "${nameCol}" not found in DB, inserting unlinked`);
        }
        notes = notesCol || null;
      } else {
        notes = buildNotes(clientCol, notesCol);
      }

      transactions.push({
        businessId: BUSINESS_ID,
        type: TransactionType.INCOME,
        category: TransactionCategory.SALE,
        clientId,
        cardAmount,
        cashAmount,
        notes,
        occurredAt,
      });
    } else if (type === "INTEREST") {
      const cardAmount = parseAmount(row[INC.CARD]);
      const cashAmount = parseAmount(row[INC.CASH]);
      const notesCol = row[INC.NOTES]?.trim() || "";

      transactions.push({
        businessId: BUSINESS_ID,
        type: TransactionType.INCOME,
        category: TransactionCategory.INTEREST,
        cardAmount,
        cashAmount,
        notes: notesCol || null,
        occurredAt,
      });
    } else if (type === "CONVERT") {
      const cardRaw = row[INC.CARD]?.trim() || "";
      const cashRaw = row[INC.CASH]?.trim() || "";
      const notesCol = row[INC.NOTES]?.trim() || null;
      const hasNegative = isNegativeAmount(cardRaw) || isNegativeAmount(cashRaw);

      if (hasNegative) {
        // Late format: +/- signs indicate direction. Create both INCOME + EXPENSE.
        const cardVal = parseAmount(cardRaw);
        const cashVal = parseAmount(cashRaw);

        if (cardVal > 0 && cashVal < 0) {
          // Cash-to-Card: card comes in, cash goes out
          const amount = Math.abs(cardVal);
          transactions.push(
            {
              businessId: BUSINESS_ID,
              type: TransactionType.INCOME,
              category: TransactionCategory.CONVERT,
              cardAmount: amount,
              cashAmount: 0,
              notes: notesCol,
              occurredAt,
            },
            {
              businessId: BUSINESS_ID,
              type: TransactionType.EXPENSE,
              category: TransactionCategory.CONVERT,
              cardAmount: 0,
              cashAmount: amount,
              notes: notesCol,
              occurredAt,
            },
          );
        } else if (cardVal < 0 && cashVal > 0) {
          // Card-to-Cash: card goes out, cash comes in
          const amount = Math.abs(cashVal);
          transactions.push(
            {
              businessId: BUSINESS_ID,
              type: TransactionType.INCOME,
              category: TransactionCategory.CONVERT,
              cardAmount: 0,
              cashAmount: amount,
              notes: notesCol,
              occurredAt,
            },
            {
              businessId: BUSINESS_ID,
              type: TransactionType.EXPENSE,
              category: TransactionCategory.CONVERT,
              cardAmount: amount,
              cashAmount: 0,
              notes: notesCol,
              occurredAt,
            },
          );
        } else {
          warnings.push(`Line ${csvLine}: Unexpected CONVERT sign pattern card="${cardRaw}" cash="${cashRaw}"`);
        }
      } else {
        // Early format: positive values only. Just create the INCOME side;
        // the EXPENSE counterpart comes from the expense columns.
        const cardAmount = parseAmount(cardRaw);
        const cashAmount = parseAmount(cashRaw);
        transactions.push({
          businessId: BUSINESS_ID,
          type: TransactionType.INCOME,
          category: TransactionCategory.CONVERT,
          cardAmount,
          cashAmount,
          notes: notesCol,
          occurredAt,
        });
      }
    }
  }

  // --- Process Expense Rows (columns 11-16) ---

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const csvLine = i + 2;
    const type = row[EXP.TYPE]?.trim().toUpperCase();
    const dateRaw = row[EXP.DATE]?.trim();
    const expenseName = row[EXP.EXPENSE]?.trim() || "";

    if (!type || !dateRaw) continue;

    let occurredAt: Date;
    try {
      occurredAt = parseDate(dateRaw);
    } catch {
      warnings.push(`Line ${csvLine}: Skipping expense row with invalid date "${dateRaw}"`);
      continue;
    }

    const cardAmount = parseAmount(row[EXP.CARD]);
    const cashAmount = parseAmount(row[EXP.CASH]);
    const notesCol = row[EXP.NOTES]?.trim() || "";

    if (type === "BUSINESS") {
      transactions.push({
        businessId: BUSINESS_ID,
        type: TransactionType.EXPENSE,
        category: TransactionCategory.BUSINESS,
        cardAmount,
        cashAmount,
        notes: buildNotes(expenseName, notesCol),
        occurredAt,
      });
    } else if (type === "PERSONAL") {
      transactions.push({
        businessId: BUSINESS_ID,
        type: TransactionType.EXPENSE,
        category: TransactionCategory.PERSONAL,
        cardAmount,
        cashAmount,
        notes: buildNotes(expenseName, notesCol),
        occurredAt,
      });
    } else if (type === "CONVERT") {
      transactions.push({
        businessId: BUSINESS_ID,
        type: TransactionType.EXPENSE,
        category: TransactionCategory.CONVERT,
        cardAmount,
        cashAmount,
        notes: buildNotes(expenseName !== "-" ? expenseName : null, notesCol) || "Cash Convert",
        occurredAt,
      });
    }
  }

  // --- Summary before insert ---

  const incomeCount = transactions.filter((t) => t.type === TransactionType.INCOME).length;
  const expenseCount = transactions.filter((t) => t.type === TransactionType.EXPENSE).length;
  const saleCount = transactions.filter((t) => t.category === TransactionCategory.SALE).length;
  const convertCount = transactions.filter((t) => t.category === TransactionCategory.CONVERT).length;
  const linkedCount = transactions.filter((t) => t.clientId).length;

  console.log("\n--- Summary ---");
  console.log(`Total transactions to insert: ${transactions.length}`);
  console.log(`  Income: ${incomeCount} (${saleCount} sales, ${incomeCount - saleCount} other)`);
  console.log(`  Expense: ${expenseCount}`);
  console.log(`  Conversions (both sides): ${convertCount}`);
  console.log(`  Client-linked sales: ${linkedCount}`);

  if (warnings.length > 0) {
    console.log(`\n--- Warnings (${warnings.length}) ---`);
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  }

  // --- Delete existing and insert ---

  console.log("\nDeleting existing transactions for businessId=1...");
  const deleted = await prisma.transaction.deleteMany({
    where: { businessId: BUSINESS_ID },
  });
  console.log(`Deleted ${deleted.count} existing transactions`);

  console.log("Inserting transactions...");
  let inserted = 0;

  for (const t of transactions) {
    const data: Prisma.TransactionCreateInput = {
      business: { connect: { id: t.businessId } },
      type: t.type,
      category: t.category,
      cardAmount: t.cardAmount,
      cashAmount: t.cashAmount,
      notes: t.notes,
      occurredAt: t.occurredAt,
      updatedAt: new Date(),
    };

    if (t.clientId) {
      data.client = { connect: { id: t.clientId } };
    }

    await prisma.transaction.create({ data });
    inserted++;

    if (inserted % 100 === 0) {
      console.log(`  ...inserted ${inserted}/${transactions.length}`);
    }
  }

  console.log(`\nDone! Inserted ${inserted} transactions.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
