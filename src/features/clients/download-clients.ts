import "dotenv/config";
import fs from "fs";
import path from "path";
import { chromium, type BrowserContext } from "playwright";

const AUTH_STATE_PATH = path.resolve(".acuity-auth-state.json");
const DOWNLOAD_DIR = path.resolve("src/features/clients");
const CSV_FILENAME = "clients-export.csv";

const ACUITY_LOGIN_URL =
  "https://secure.acuityscheduling.com/login.php?ajax=0&popup=0&redirect=1";
const ACUITY_CLIENTS_URL =
  "https://secure.acuityscheduling.com/clients.php?action=importexport";

function getCredentials() {
  const email = process.env.ACUITY_EMAIL;
  const password = process.env.ACUITY_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ACUITY_EMAIL and ACUITY_PASSWORD must be set in your .env file",
    );
  }

  return { email, password };
}

function getBackupCode(): string {
  const code = process.env.ACUITY_BACKUP_CODE;
  if (!code) {
    throw new Error(
      "2FA is required but ACUITY_BACKUP_CODE is not set in your .env file. " +
        "Generate a backup code from Acuity Scheduling and add it to .env.",
    );
  }
  return code;
}

function hasAuthState(): boolean {
  return fs.existsSync(AUTH_STATE_PATH);
}

async function createContext() {
  const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";

  const browser = await chromium.launch({ headless });
  const contextOptions: Parameters<typeof browser.newContext>[0] = {
    acceptDownloads: true,
  };

  if (hasAuthState()) {
    contextOptions.storageState = AUTH_STATE_PATH;
  }

  const context = await browser.newContext(contextOptions);
  return { browser, context };
}

async function saveAuthState(context: BrowserContext) {
  const state = await context.storageState();
  fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(state, null, 2));
  console.log("Auth state saved for future sessions");
}

async function isLoggedIn(context: BrowserContext): Promise<boolean> {
  const page = await context.newPage();
  try {
    await page.goto(ACUITY_CLIENTS_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const url = page.url();
    // If we weren't redirected to login, the session is still valid
    const loggedIn = !url.includes("/login");
    if (loggedIn) {
      console.log("Existing session is valid");
    }
    return loggedIn;
  } finally {
    await page.close();
  }
}

async function login(context: BrowserContext) {
  const { email, password } = getCredentials();
  const page = await context.newPage();

  try {
    console.log("Navigating to Acuity login...");
    await page.goto(ACUITY_LOGIN_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    console.log("Entering credentials...");
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.click('input[type="submit"]');

    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const url = page.url();
    const pageContent = await page.content();

    const needs2FA =
      url.includes("/authenticate") ||
      url.includes("/two-factor") ||
      url.includes("/2fa") ||
      pageContent.includes("backup code") ||
      pageContent.includes("two-factor") ||
      pageContent.includes("verification code") ||
      pageContent.includes("Two-Factor");

    if (needs2FA) {
      console.log("2FA required, using backup code...");
      await handle2FA(page);
    }

    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    if (finalUrl.includes("/login") || finalUrl.includes("/authenticate")) {
      throw new Error(
        `Login failed - still on auth page: ${finalUrl}. Check your credentials.`,
      );
    }

    console.log("Login successful");
    await saveAuthState(context);
  } finally {
    await page.close();
  }
}

async function handle2FA(page: import("playwright").Page) {
  const backupCode = getBackupCode();

  // Look for a link/button to switch to backup code input
  console.log("Switching to backup code entry...");
  const useAnotherMethodLink = page.locator("text=/Use a different method/i");
  await useAnotherMethodLink.first().click();
  const backupCodeLink = page.locator("text=/Backup Code/i");
  await backupCodeLink.first().click();
  await page.waitForTimeout(1000);

  // Find the backup code input and fill it
  const codeInput = page.locator(
    'input[name="code"], input[name="backup_code"], input[name="backupCode"], input[type="text"], input[type="tel"]',
  );
  await codeInput.first().fill(backupCode);

  // Check "remember this device" if available
  const rememberCheckbox = page.locator(
    'input[type="checkbox"][name*="remember"], input[type="checkbox"][id*="remember"], label:has-text("remember") input[type="checkbox"]',
  );
  if ((await rememberCheckbox.count()) > 0) {
    const isChecked = await rememberCheckbox.first().isChecked();
    if (!isChecked) {
      await rememberCheckbox.first().check();
      console.log('Checked "remember this device"');
    }
  }

  await page.click('button[type="submit"], input[type="submit"]');
  await page.waitForTimeout(3000);
  console.log("2FA completed");
}

async function downloadExport(context: BrowserContext): Promise<string> {
  const page = await context.newPage();
  const csvPath = path.join(DOWNLOAD_DIR, CSV_FILENAME);

  try {
    console.log("Navigating to Clients page...");
    await page.goto(ACUITY_CLIENTS_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    console.log("Clicking Export Client List...");
    await page
      .locator(
        'a:has-text("Export Client List"), button:has-text("Export Client List")',
      )
      .first()
      .click();
    await page.waitForTimeout(2000);

    console.log("Clicking Export Clients to start download...");
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      page
        .locator('input[type="submit"][value="Export Clients"]')
        .first()
        .click(),
    ]);

    console.log("Download started, saving file...");
    await download.saveAs(csvPath);
    console.log(`CSV downloaded to ${csvPath}`);

    return csvPath;
  } finally {
    await page.close();
  }
}

export async function downloadClientList(): Promise<string> {
  const { browser, context } = await createContext();

  try {
    // If we have saved auth state, check if it's still valid
    if (hasAuthState()) {
      const valid = await isLoggedIn(context);
      if (!valid) {
        console.log("Session expired, logging in again...");
        await login(context);
      }
    } else {
      console.log("No saved session, logging in...");
      await login(context);
    }

    return await downloadExport(context);
  } finally {
    await context.close();
    await browser.close();
  }
}
