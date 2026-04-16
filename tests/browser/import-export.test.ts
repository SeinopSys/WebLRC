import { test, expect, type Page } from "@playwright/test";
import {
  gotoApp,
  waitForDialog,
  waitForDialogClosed,
  clickDialogButton,
  SAMPLE_LRC_PATH,
} from "./helpers";

// Scope all entry counts to .editor to exclude the hidden #editor-entry-template.
const entries = (page: Page) => page.locator(".editor .time-entry");

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test("pasting raw lyrics creates one entry per line plus a trailing empty entry", async ({
  page,
}) => {
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);

  await page
    .locator("#rawlyrics textarea")
    .fill("Line one\nLine two\nLine three");
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);

  // importFromText calls regenEntries which replaces all editor content:
  // 3 lines + 1 trailing empty = 4 entries
  await expect(page.locator(".editor .time-entry")).toHaveCount(4);
});

test("pasted lyrics appear as entry text", async ({ page }) => {
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);

  await page.locator("#rawlyrics textarea").fill("First line\nSecond line");
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);

  const entries = page.locator(".editor .time-entry");
  await expect(entries).toHaveCount(3); // 2 lines + 1 trailing empty
  const entryTexts = page.locator(".editor .time-entry .text");
  await expect(entryTexts.nth(0)).toHaveText("First line");
  await expect(entryTexts.nth(1)).toHaveText("Second line");
});

test("cancelling the paste dialog makes no changes", async ({ page }) => {
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);

  await page.locator("#rawlyrics textarea").fill("Should not appear");
  await clickDialogButton(page, "Cancel");
  await waitForDialogClosed(page);

  // Editor unchanged: 1 entry (constructor append)
  await expect(entries(page)).toHaveCount(1);
});

test("importing an LRC file populates the editor with timed entries", async ({
  page,
}) => {
  // #lrcfilebtn is inside the Import dropdown — open it first.
  await page.locator("button:has-text('Import')").click();
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.click("#lrcfilebtn"),
  ]);
  await fileChooser.setFiles(SAMPLE_LRC_PATH);
  await expect(page.locator(".editor .time-entry")).toHaveCount(7, {
    timeout: 5000,
  });
});

test("imported LRC file first entry has a valid timestamp", async ({
  page,
}) => {
  await page.locator("button:has-text('Import')").click();
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.click("#lrcfilebtn"),
  ]);
  await fileChooser.setFiles(SAMPLE_LRC_PATH);
  await expect(page.locator(".editor .time-entry")).toHaveCount(7, {
    timeout: 5000,
  });
  await expect(
    page.locator(".editor .time-entry .timestamp").first(),
  ).toHaveText("0:05.000");
});

test("merge toggle changes status text from On to Off", async ({ page }) => {
  await page.locator("button:has-text('Export')").click();
  const toggle = page.locator("#lrcmergetogglebtn .status");
  await expect(toggle).toHaveText("On");
  await page.locator("#lrcmergetogglebtn").click();
  await expect(toggle).toHaveText("Off");
});

test("merge toggle persists across page reloads", async ({ page }) => {
  await page.locator("button:has-text('Export')").click();
  await page.locator("#lrcmergetogglebtn").click();
  await gotoApp(page);
  await page.locator("button:has-text('Export')").click();
  await expect(page.locator("#lrcmergetogglebtn .status")).toHaveText("Off");
});

test("exporting with metadata triggers a file download", async ({ page }) => {
  await page.locator("button:has-text('Import')").click();
  await page.locator("#lrcpastebtn").click();
  await waitForDialog(page);
  await page.locator("#rawlyrics textarea").fill("[0:05.000]Hello");
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);

  // #lrcexportbtn is inside the Export dropdown — open it first.
  await page.locator("button:has-text('Export')").click();
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

  await page.locator("button:has-text('Export')").click();
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
  await page.locator("#rawlyrics textarea").fill("Hello");
  await clickDialogButton(page, "Import");
  await waitForDialogClosed(page);
  // Add a timestamp to the first entry so it gets included in the export output
  await page.locator(".editor .time-entry .timestamp").first().fill("5");
  await page.locator("button:has-text('Export')").click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#lrcexportnometabtn").click(),
  ]);

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const content = Buffer.concat(chunks).toString("utf8");
  expect(content).toMatch(/\[\d{2}:\d{2}\.\d{3}]/);
});
