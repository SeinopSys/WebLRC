import { test, expect, type Page } from "@playwright/test";
import {
  gotoApp,
  waitForDialog,
  waitForDialogClosed,
  clickDialogButton,
} from "./helpers";

// Scope all entry counts to .editor to exclude the hidden #editor-entry-template.
const entries = (page: Page) => page.locator(".editor .time-entry");

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test("typing in the text field updates the entry text", async ({ page }) => {
  const text = page.locator(".time-entry .text").first();
  await text.click();
  await text.fill("Hello world");
  await expect(text).toHaveText("Hello world");
});

test("typing a valid timestamp removes the invalid class", async ({ page }) => {
  const ts = page.locator(".time-entry .timestamp").first();
  await ts.click();
  await ts.fill("1:23.456");
  await expect(ts).not.toHaveClass(/invalid/);
});

test("typing an invalid timestamp adds the invalid class", async ({ page }) => {
  const ts = page.locator(".time-entry .timestamp").first();
  await ts.click();
  await ts.fill("99:99:99");
  // Trigger keyup so the validation handler fires
  await ts.dispatchEvent("keyup");
  await expect(ts).toHaveClass(/invalid/);
});

test("Add row below button inserts a new entry after the current one", async ({
  page,
}) => {
  // The editor starts with 1 entry (1 from constructor).
  await expect(entries(page)).toHaveCount(1);
  await page.locator(".time-entry .addrow-down").first().click();
  await expect(entries(page)).toHaveCount(2);
});

test("Add row above button inserts a new entry before the current one", async ({
  page,
}) => {
  // Mark the first entry so we can verify its new position after the insert.
  const firstText = page.locator(".time-entry .text").first();
  await firstText.click();
  await firstText.fill("Original");

  await page.locator(".time-entry .addrow-up").first().click();
  await expect(entries(page)).toHaveCount(2);
  // "Original" entry has shifted to index 1
  await expect(page.locator(".editor .time-entry .text").nth(1)).toHaveText(
    "Original",
  );
});

test("Remove row button is disabled when only one entry exists", async ({
  page,
}) => {
  // Both initial entries start with remrow disabled (updateEntryActionButtons
  // is not called in the constructor). The first button is therefore disabled.
  await expect(page.locator(".time-entry .remrow").first()).toBeDisabled();
});

test("Remove row shows confirmation dialog for a non-empty entry", async ({
  page,
}) => {
  // Add a third row so updateEntryActionButtons enables all remrow buttons.
  await page.locator(".time-entry .addrow-down").first().click();
  const text = page.locator(".time-entry .text").first();
  await text.click();
  await text.fill("Some lyrics");
  await page.locator(".time-entry .remrow").first().click();
  await waitForDialog(page);
  await expect(page.locator("#dialogContent")).toContainText("Some lyrics");
});

test("confirming Remove row dialog removes the entry", async ({ page }) => {
  // 1 initial → add 1 → 2 entries; remove first → 1 remaining.
  await page.locator(".time-entry .addrow-down").first().click();
  const text = page.locator(".time-entry .text").first();
  await text.click();
  await text.fill("Delete me");
  await page.locator(".time-entry .remrow").first().click();
  await waitForDialog(page);
  await clickDialogButton(page, "Yes");
  await waitForDialogClosed(page);
  await expect(entries(page)).toHaveCount(1);
});

test("cancelling Remove row dialog keeps the entry", async ({ page }) => {
  // 1 initial → add 1 → 2 entries; cancel removal → still 2.
  await page.locator(".time-entry .addrow-down").first().click();
  const text = page.locator(".time-entry .text").first();
  await text.click();
  await text.fill("Keep me");
  await page.locator(".time-entry .remrow").first().click();
  await waitForDialog(page);
  await clickDialogButton(page, "No");
  await waitForDialogClosed(page);
  await expect(entries(page)).toHaveCount(2);
});

test("Shift-clicking Remove row removes without confirmation", async ({
  page,
}) => {
  // 1 initial → add 1 → 2 entries; shift-click removes first → 1 remaining.
  await page.locator(".time-entry .addrow-down").first().click();
  const text = page.locator(".time-entry .text").first();
  await text.click();
  await text.fill("Shift remove");
  await page
    .locator(".time-entry .remrow")
    .first()
    .click({ modifiers: ["Shift"] });
  // No dialog — entry removed immediately.
  await expect(entries(page)).toHaveCount(1);
});
