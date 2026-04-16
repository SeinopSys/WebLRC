import { expect, type Page, test } from "@playwright/test";
import {
  clickDialogButton,
  gotoApp,
  waitForDialog,
  waitForDialogClosed,
} from "./helpers";

async function importLines(page: Page, text: string) {
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);
  await page.locator("#rawlyrics textarea").fill(text);
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);
}

// Scope all entry counts to .editor to exclude the hidden #editor-entry-template.
const entries = (page: Page) => page.locator(".editor .time-entry");

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
  await expect(entries(page)).toHaveCount(4);

  await page.click("#lrcclrbtn");
  await waitForDialog(page);
  await clickDialogButton(page, "Yes");
  await waitForDialogClosed(page);

  await expect(page.locator(".editor .time-entry")).toHaveCount(1);
  await expect(page.locator(".editor .time-entry .text").first()).toHaveText(
    "",
  );
});

test("cancelling discard keeps all entries", async ({ page }) => {
  await importLines(page, "Line one\nLine two");
  const countBefore = await page.locator(".editor .time-entry").count();

  await page.click("#lrcclrbtn");
  await waitForDialog(page);
  await clickDialogButton(page, "No");
  await waitForDialogClosed(page);

  await expect(page.locator(".editor .time-entry")).toHaveCount(countBefore);
});
