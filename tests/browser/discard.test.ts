import { test, expect } from "@playwright/test";
import {
  gotoApp,
  waitForDialog,
  waitForDialogClosed,
  clickDialogButton,
} from "./helpers";

async function importLines(
  page: import("@playwright/test").Page,
  text: string,
) {
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);
  await page.locator("#rawlyrics textarea").fill(text);
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);
}

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test("clicking Discard lyrics opens a confirmation dialog", async ({
  page,
}) => {
  await importLines(page, "Line one\nLine two");
  await page.click("#lrcclrbtn");
  await waitForDialog(page);
  await expect(page.locator("#dialogOverlay")).toBeVisible();
});

test("confirming discard resets the editor to a single blank entry", async ({
  page,
}) => {
  await importLines(page, "Line one\nLine two\nLine three");
  await expect(page.locator(".time-entry")).toHaveCount(4);

  await page.click("#lrcclrbtn");
  await waitForDialog(page);
  await clickDialogButton(page, "Yes");
  await waitForDialogClosed(page);

  await expect(page.locator(".time-entry")).toHaveCount(1);
  await expect(page.locator(".time-entry .text").first()).toHaveText("");
});

test("cancelling discard keeps all entries", async ({ page }) => {
  await importLines(page, "Line one\nLine two");
  const countBefore = await page.locator(".time-entry").count();

  await page.click("#lrcclrbtn");
  await waitForDialog(page);
  await clickDialogButton(page, "No");
  await waitForDialogClosed(page);

  await expect(page.locator(".time-entry")).toHaveCount(countBefore);
});
