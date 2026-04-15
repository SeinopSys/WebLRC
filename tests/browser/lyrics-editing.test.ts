import { test, expect } from "@playwright/test";
import {
  gotoApp,
  waitForDialog,
  waitForDialogClosed,
  clickDialogButton,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test("typing in the text field updates the entry text", async ({ page }) => {
  const text = page.locator(".time-entry .text").first();
  await text.click();
  await text.type("Hello world");
  await expect(text).toHaveText("Hello world");
});

test("typing a valid timestamp removes the invalid class", async ({ page }) => {
  const ts = page.locator(".time-entry .timestamp").first();
  await ts.click();
  await ts.type("1:23.456");
  await expect(ts).not.toHaveClass(/invalid/);
});

test("typing an invalid timestamp adds the invalid class", async ({ page }) => {
  const ts = page.locator(".time-entry .timestamp").first();
  await ts.click();
  await ts.type("99:99:99");
  // Trigger keyup so the validation handler fires
  await ts.dispatchEvent("keyup");
  await expect(ts).toHaveClass(/invalid/);
});

test("Add row below button inserts a new entry after the current one", async ({
  page,
}) => {
  await expect(page.locator(".time-entry")).toHaveCount(1);
  await page.locator(".time-entry .addrow-down").first().click();
  await expect(page.locator(".time-entry")).toHaveCount(2);
});

test("Add row above button inserts a new entry before the current one", async ({
  page,
}) => {
  // Set text on the first entry so we can identify it
  const firstText = page.locator(".time-entry .text").first();
  await firstText.click();
  await firstText.type("Original");

  await page.locator(".time-entry .addrow-up").first().click();
  await expect(page.locator(".time-entry")).toHaveCount(2);
  // Original entry is now the second one
  await expect(page.locator(".time-entry .text").nth(1)).toHaveText("Original");
});

test("Remove row button is disabled when only one entry exists", async ({
  page,
}) => {
  await expect(page.locator(".time-entry .remrow").first()).toBeDisabled();
});

test("Remove row shows confirmation dialog for a non-empty entry", async ({
  page,
}) => {
  // Add a second row so remove is enabled
  await page.locator(".time-entry .addrow-down").first().click();
  // Type something in the first row so it triggers the confirmation
  const text = page.locator(".time-entry .text").first();
  await text.click();
  await text.type("Some lyrics");
  // Click remove on the first row
  await page.locator(".time-entry .remrow").first().click();
  await waitForDialog(page);
  await expect(page.locator("#dialogContent")).toContainText("Some lyrics");
});

test("confirming Remove row dialog removes the entry", async ({ page }) => {
  await page.locator(".time-entry .addrow-down").first().click();
  const text = page.locator(".time-entry .text").first();
  await text.click();
  await text.type("Delete me");
  await page.locator(".time-entry .remrow").first().click();
  await waitForDialog(page);
  await clickDialogButton(page, "Yes");
  await waitForDialogClosed(page);
  await expect(page.locator(".time-entry")).toHaveCount(1);
});

test("cancelling Remove row dialog keeps the entry", async ({ page }) => {
  await page.locator(".time-entry .addrow-down").first().click();
  const text = page.locator(".time-entry .text").first();
  await text.click();
  await text.type("Keep me");
  await page.locator(".time-entry .remrow").first().click();
  await waitForDialog(page);
  await clickDialogButton(page, "No");
  await waitForDialogClosed(page);
  await expect(page.locator(".time-entry")).toHaveCount(2);
});

test("Shift-clicking Remove row removes without confirmation", async ({
  page,
}) => {
  await page.locator(".time-entry .addrow-down").first().click();
  const text = page.locator(".time-entry .text").first();
  await text.click();
  await text.type("Shift remove");
  await page
    .locator(".time-entry .remrow")
    .first()
    .click({ modifiers: ["Shift"] });
  // No dialog, entry gone immediately
  await expect(page.locator(".time-entry")).toHaveCount(1);
});
