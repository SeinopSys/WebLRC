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

test("clicking the info button opens a dialog", async ({ page }) => {
  await page.click("#shortcut-info");
  await waitForDialog(page);
  await expect(page.locator("#dialogOverlay")).toBeVisible();
});

test("dialog title contains 'How-To'", async ({ page }) => {
  await page.click("#shortcut-info");
  await waitForDialog(page);
  await expect(page.locator("#dialogHeader")).toContainText("How-To");
});

test("dialog contains Keyboard Shortcuts heading", async ({ page }) => {
  await page.click("#shortcut-info");
  await waitForDialog(page);
  await expect(page.locator("#dialogContent")).toContainText(
    "Keyboard Shortcuts",
  );
});

test("dialog contains Limitations heading", async ({ page }) => {
  await page.click("#shortcut-info");
  await waitForDialog(page);
  await expect(page.locator("#dialogContent")).toContainText("Limitations");
});

test("dialog contains keyboard shortcut elements", async ({ page }) => {
  await page.click("#shortcut-info");
  await waitForDialog(page);
  await expect(page.locator("#dialogContent kbd").first()).toBeVisible();
});

test("dialog contains player controls section", async ({ page }) => {
  await page.click("#shortcut-info");
  await waitForDialog(page);
  await expect(page.locator("#dialogContent")).toContainText("Player controls");
});

test("dialog contains sync mode description", async ({ page }) => {
  await page.click("#shortcut-info");
  await waitForDialog(page);
  await expect(page.locator("#dialogContent")).toContainText("sync mode");
});

test("clicking Close removes the dialog", async ({ page }) => {
  await page.click("#shortcut-info");
  await waitForDialog(page);
  await clickDialogButton(page, "Close");
  await waitForDialogClosed(page);
  await expect(page.locator("#dialogOverlay")).toHaveCount(0);
});
