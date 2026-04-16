import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test("page title is correct", async ({ page }) => {
  await expect(page).toHaveTitle("LRC Editor & Timer");
});

test("editor starts in edit mode", async ({ page }) => {
  await expect(page.locator(".editor.mode-edit")).toBeVisible();
});

test("editor starts with a single time-entry row (constructor init)", async ({
  page,
}) => {
  // The TimingEditor constructor appends a blank .time-entry, so the initial count is 1.
  await expect(page.locator(".editor .time-entry")).toHaveCount(1);
});

test("backup button group is hidden when no backup exists", async ({
  page,
}) => {
  await expect(page.locator("#restore-backup").locator("..")).toHaveClass(
    /d-none/,
  );
});

test("volume display shows 50% on first load", async ({ page }) => {
  await expect(page.locator("#volumedisp")).toContainText("50%");
});

test("play/pause and stop buttons are disabled before audio is loaded", async ({
  page,
}) => {
  await expect(page.locator("#playbackbtn")).toBeDisabled();
  await expect(page.locator("#stopbtn")).toBeDisabled();
});

test("mode switch button is disabled before audio is loaded", async ({
  page,
}) => {
  await expect(page.locator("#lrcmodebtn")).toBeDisabled();
});
