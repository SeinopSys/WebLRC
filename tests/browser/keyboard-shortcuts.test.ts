import { test, expect, type Page } from "@playwright/test";
import {
  gotoApp,
  loadSilentAudio,
  waitForDialog,
  waitForDialogClosed,
  clickDialogButton,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

// ─── Volume shortcuts (no audio required) ────────────────────────────────────

test("Page Down decreases volume by 5%", async ({ page }) => {
  await page.keyboard.press("PageDown");
  await expect(page.locator("#volumedisp")).toContainText("45%");
});

test("Page Up increases volume by 5%", async ({ page }) => {
  await page.keyboard.press("PageUp");
  await expect(page.locator("#volumedisp")).toContainText("55%");
});

test("Shift+Page Up increases volume by 10%", async ({ page }) => {
  await page.keyboard.press("Shift+PageUp");
  await expect(page.locator("#volumedisp")).toContainText("60%");
});

test("Shift+Page Down decreases volume by 10%", async ({ page }) => {
  await page.keyboard.press("Shift+PageDown");
  await expect(page.locator("#volumedisp")).toContainText("40%");
});

// ─── Timestamp edit shortcuts (no audio required) ────────────────────────────

test("Ctrl+Up on a focused timestamp increments it by 100ms", async ({
  page,
}) => {
  const ts = page.locator(".time-entry .timestamp").first();
  await ts.click();
  await ts.fill("1:00.000");
  await ts.dispatchEvent("keyup");
  await page.keyboard.press("Control+ArrowUp");
  await expect(ts).toHaveText("1:00.100");
});

test("Ctrl+Down on a focused timestamp decrements it by 100ms", async ({
  page,
}) => {
  const ts = page.locator(".time-entry .timestamp").first();
  await ts.click();
  await ts.fill("1:00.500");
  await ts.dispatchEvent("keyup");
  await page.keyboard.press("Control+ArrowDown");
  await expect(ts).toHaveText("1:00.400");
});

// ─── Audio-dependent shortcuts ───────────────────────────────────────────────

test("Space toggles playback (play button icon changes)", async ({ page }) => {
  await loadSilentAudio(page);

  // Initially showing fa-play
  await expect(page.locator("#playbackbtn span")).toHaveClass(/fa-play/);

  await page.keyboard.press("Space");
  // Should now show fa-pause (audio started)
  await expect(page.locator("#playbackbtn span")).toHaveClass(/fa-pause/);
});

test("Period (.) stops playback", async ({ page }) => {
  await loadSilentAudio(page);

  // Start playing
  await page.click("#playbackbtn");
  await expect(page.locator("#playbackbtn span")).toHaveClass(/fa-pause/);

  // Stop via keyboard
  await page.keyboard.press(".");
  await expect(page.locator("#playbackbtn span")).toHaveClass(/fa-play/);
});

// ─── Sync mode shortcuts ─────────────────────────────────────────────────────

async function importLrcAndEnterSync(page: Page) {
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);
  await page
    .locator("#rawlyrics textarea")
    .fill("Line one\nLine two\nLine three");
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);
  await loadSilentAudio(page);
  await page.click("#lrcmodebtn");
  // Editor should now be in sync mode
  await expect(page.locator(".editor.mode-sync")).toBeVisible();
}

test("Down arrow in sync mode moves the handle to the next entry", async ({
  page,
}) => {
  await importLrcAndEnterSync(page);
  const entries = page.locator(".time-entry");
  await expect(entries.first()).toHaveClass(/sync-handle/);
  await page.keyboard.press("ArrowDown");
  await expect(entries.nth(1)).toHaveClass(/sync-handle/);
});

test("Up arrow in sync mode moves the handle back to the previous entry", async ({
  page,
}) => {
  await importLrcAndEnterSync(page);
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".time-entry").nth(1)).toHaveClass(/sync-handle/);
  await page.keyboard.press("ArrowUp");
  await expect(page.locator(".time-entry").first()).toHaveClass(/sync-handle/);
});
