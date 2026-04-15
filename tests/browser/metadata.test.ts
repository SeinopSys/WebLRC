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

test("metadata badge is empty on first load", async ({ page }) => {
  await expect(page.locator(".metadata-count")).toHaveText("");
});

test("setting artist and title shows badge count of 2", async ({ page }) => {
  await page.click("#lrcmetadatabtn");
  await waitForDialog(page);

  await page.locator("#meta_input_ar").fill("My Artist");
  await page.locator("#meta_input_ti").fill("My Title");
  await clickDialogButton(page, "Save");
  await waitForDialogClosed(page);

  await expect(page.locator(".metadata-count")).toHaveText("2");
});

test("setting only one field shows badge count of 1", async ({ page }) => {
  await page.click("#lrcmetadatabtn");
  await waitForDialog(page);

  await page.locator("#meta_input_ar").fill("Solo Artist");
  await clickDialogButton(page, "Save");
  await waitForDialogClosed(page);

  await expect(page.locator(".metadata-count")).toHaveText("1");
});

test("metadata values are pre-populated when dialog is reopened", async ({
  page,
}) => {
  await page.click("#lrcmetadatabtn");
  await waitForDialog(page);
  await page.locator("#meta_input_ar").fill("Saved Artist");
  await clickDialogButton(page, "Save");
  await waitForDialogClosed(page);

  // Reopen
  await page.click("#lrcmetadatabtn");
  await waitForDialog(page);
  await expect(page.locator("#meta_input_ar")).toHaveValue("Saved Artist");
  await clickDialogButton(page, "Cancel");
});

test("clicking Reset clears all metadata fields and badge", async ({
  page,
}) => {
  await page.click("#lrcmetadatabtn");
  await waitForDialog(page);
  await page.locator("#meta_input_ar").fill("Artist to reset");
  await clickDialogButton(page, "Save");
  await waitForDialogClosed(page);

  // Reopen and reset
  await page.click("#lrcmetadatabtn");
  await waitForDialog(page);
  await page.locator("#dialogContent button[type=reset]").click();

  // Fields should be cleared
  await expect(page.locator("#meta_input_ar")).toHaveValue("");
  // Save with empty fields
  await clickDialogButton(page, "Save");
  await waitForDialogClosed(page);

  await expect(page.locator(".metadata-count")).toHaveText("");
});

test("cancelling the metadata dialog discards changes", async ({ page }) => {
  await page.click("#lrcmetadatabtn");
  await waitForDialog(page);
  await page.locator("#meta_input_ar").fill("Discarded Artist");
  await clickDialogButton(page, "Cancel");
  await waitForDialogClosed(page);

  await expect(page.locator(".metadata-count")).toHaveText("");
});
