import { test, expect } from "@playwright/test";
import {
  gotoApp,
  waitForDialog,
  waitForDialogClosed,
  clickDialogButton,
} from "./helpers";

const BACKUP_KEY = "lrc-backup";

const sampleBackup = JSON.stringify({
  metadata: { ar: "Backup Artist" },
  timings: [
    { ts: "0:05.000", str: "Hello" },
    { ts: "0:10.000", str: "World" },
  ],
});

test("backup buttons are hidden when no backup exists", async ({ page }) => {
  await gotoApp(page);
  await expect(page.locator("#restore-backup").locator("..")).toHaveClass(
    /d-none/,
  );
});

test("backup buttons become visible when localStorage has valid backup data", async ({
  page,
}) => {
  await page.addInitScript((backup) => {
    localStorage.setItem("lrc-backup", backup);
  }, sampleBackup);
  await gotoApp(page);
  await expect(page.locator("#restore-backup").locator("..")).not.toHaveClass(
    /d-none/,
  );
});

test("restore backup dialog shows the backup JSON preview", async ({
  page,
}) => {
  await page.addInitScript((backup) => {
    localStorage.setItem("lrc-backup", backup);
  }, sampleBackup);
  await gotoApp(page);

  await page.click("#restore-backup");
  await waitForDialog(page);
  await expect(page.locator(".backup-data")).toContainText("Backup Artist");
});

test("confirming restore populates the editor with backup entries", async ({
  page,
}) => {
  await page.addInitScript((backup) => {
    localStorage.setItem("lrc-backup", backup);
  }, sampleBackup);
  await gotoApp(page);

  await page.click("#restore-backup");
  await waitForDialog(page);
  await clickDialogButton(page, "Yes");
  await waitForDialogClosed(page);

  await expect(page.locator(".time-entry")).toHaveCount(2);
  await expect(page.locator(".time-entry .text").first()).toHaveText("Hello");
  await expect(page.locator(".time-entry .text").nth(1)).toHaveText("World");
});

test("confirming restore sets metadata from backup", async ({ page }) => {
  await page.addInitScript((backup) => {
    localStorage.setItem("lrc-backup", backup);
  }, sampleBackup);
  await gotoApp(page);

  await page.click("#restore-backup");
  await waitForDialog(page);
  await clickDialogButton(page, "Yes");
  await waitForDialogClosed(page);

  await expect(page.locator(".metadata-count")).toHaveText("1");
});

test("cancelling restore keeps the editor empty", async ({ page }) => {
  await page.addInitScript((backup) => {
    localStorage.setItem("lrc-backup", backup);
  }, sampleBackup);
  await gotoApp(page);

  await page.click("#restore-backup");
  await waitForDialog(page);
  await clickDialogButton(page, "No");
  await waitForDialogClosed(page);

  await expect(page.locator(".time-entry")).toHaveCount(1);
});

test("discarding backup hides the backup buttons and removes the localStorage key", async ({
  page,
}) => {
  await page.addInitScript((backup) => {
    localStorage.setItem("lrc-backup", backup);
  }, sampleBackup);
  await gotoApp(page);

  await page.click("#clear-backup");
  await waitForDialog(page);
  await clickDialogButton(page, "Yes");
  await waitForDialogClosed(page);

  await expect(page.locator("#restore-backup").locator("..")).toHaveClass(
    /d-none/,
  );

  const stored = await page.evaluate(
    (key) => localStorage.getItem(key),
    BACKUP_KEY,
  );
  expect(stored).toBeNull();
});

test("cancelling discard backup keeps the backup buttons visible", async ({
  page,
}) => {
  await page.addInitScript((backup) => {
    localStorage.setItem("lrc-backup", backup);
  }, sampleBackup);
  await gotoApp(page);

  await page.click("#clear-backup");
  await waitForDialog(page);
  await clickDialogButton(page, "No");
  await waitForDialogClosed(page);

  await expect(page.locator("#restore-backup").locator("..")).not.toHaveClass(
    /d-none/,
  );
});
