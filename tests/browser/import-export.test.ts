import { test, expect } from "@playwright/test";
import {
  gotoApp,
  waitForDialog,
  waitForDialogClosed,
  clickDialogButton,
  SAMPLE_LRC_PATH,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test("pasting raw lyrics creates one entry per line plus a trailing empty entry", async ({
  page,
}) => {
  // Open Import > raw lyrics
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);

  await page
    .locator("#rawlyrics textarea")
    .fill("Line one\nLine two\nLine three");
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);

  // 3 lines + 1 trailing empty = 4 entries
  await expect(page.locator(".time-entry")).toHaveCount(4);
});

test("pasted lyrics appear as entry text", async ({ page }) => {
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);

  await page.locator("#rawlyrics textarea").fill("First line\nSecond line");
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);

  await expect(page.locator(".time-entry .text").first()).toHaveText(
    "First line",
  );
  await expect(page.locator(".time-entry .text").nth(1)).toHaveText(
    "Second line",
  );
});

test("cancelling the paste dialog makes no changes", async ({ page }) => {
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);

  await page.locator("#rawlyrics textarea").fill("Should not appear");
  await clickDialogButton(page, "Cancel");
  await waitForDialogClosed(page);

  await expect(page.locator(".time-entry")).toHaveCount(1);
});

test("importing an LRC file populates the editor with timed entries", async ({
  page,
}) => {
  await page.locator("#lrcfilein").setInputFiles(SAMPLE_LRC_PATH);
  // Wait for entries to load
  await expect(page.locator(".time-entry")).toHaveCount(7, { timeout: 5000 });
});

test("imported LRC file first entry has a valid timestamp", async ({
  page,
}) => {
  await page.locator("#lrcfilein").setInputFiles(SAMPLE_LRC_PATH);
  await expect(page.locator(".time-entry")).toHaveCount(7, { timeout: 5000 });
  await expect(page.locator(".time-entry .timestamp").first()).toHaveText(
    "0:05.000",
  );
});

test("merge toggle changes status text from On to Off", async ({ page }) => {
  await page.locator("button:has-text('Export')").click();
  const toggle = page.locator("#lrcmergetogglebtn .status");
  await expect(toggle).toHaveText("On");
  await page.locator("#lrcmergetogglebtn").click();
  await expect(toggle).toHaveText("Off");
});

test("merge toggle persists across page reloads", async ({ page }) => {
  // Toggle off
  await page.locator("button:has-text('Export')").click();
  await page.locator("#lrcmergetogglebtn").click();
  // Reload
  await gotoApp(page);
  // Verify it's still off
  await page.locator("button:has-text('Export')").click();
  await expect(page.locator("#lrcmergetogglebtn .status")).toHaveText("Off");
});

test("exporting with metadata triggers a file download", async ({ page }) => {
  // Import some lyrics first so the export has content
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);
  await page.locator("#rawlyrics textarea").fill("[0:05.000]Hello");
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#lrcexportbtn").click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.lrc$/);
});

test("exporting without metadata triggers a file download", async ({
  page,
}) => {
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);
  await page.locator("#rawlyrics textarea").fill("[0:05.000]Hello");
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#lrcexportnometabtn").click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.lrc$/);
});

test("exported LRC content contains timing lines", async ({ page }) => {
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);
  await page.locator("#rawlyrics textarea").fill("[0:05.000]Hello");
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#lrcexportnometabtn").click(),
  ]);

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const content = Buffer.concat(chunks).toString("utf8");
  expect(content).toMatch(/\[\d{2}:\d{2}\.\d{3}\]/);
});
