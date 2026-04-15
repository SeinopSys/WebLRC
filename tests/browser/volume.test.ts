import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test("initial volume display is 50%", async ({ page }) => {
  await expect(page.locator("#volumedisp")).toContainText("50%");
});

test("clicking volume up increases display by 5%", async ({ page }) => {
  await page.click("#volumeup");
  await expect(page.locator("#volumedisp")).toContainText("55%");
});

test("clicking volume down decreases display by 5%", async ({ page }) => {
  await page.click("#volumedown");
  await expect(page.locator("#volumedisp")).toContainText("45%");
});

test("clicking volume up multiple times increases proportionally", async ({
  page,
}) => {
  await page.click("#volumeup");
  await page.click("#volumeup");
  await expect(page.locator("#volumedisp")).toContainText("60%");
});

test("volume down is disabled at 0%", async ({ page }) => {
  // Click down 10 times to hit 0%
  for (let i = 0; i < 10; i++) await page.click("#volumedown");
  await expect(page.locator("#volumedisp")).toContainText("0%");
  await expect(page.locator("#volumedown")).toBeDisabled();
});

test("volume up is disabled at 100%", async ({ page }) => {
  // Click up 10 times to hit 100%
  for (let i = 0; i < 10; i++) await page.click("#volumeup");
  await expect(page.locator("#volumedisp")).toContainText("100%");
  await expect(page.locator("#volumeup")).toBeDisabled();
});

test("volume setting persists across page reloads", async ({ page }) => {
  await page.click("#volumeup");
  await page.click("#volumeup");
  await expect(page.locator("#volumedisp")).toContainText("60%");

  await page.reload();
  await page.locator(".editor.mode-edit").waitFor();
  await expect(page.locator("#volumedisp")).toContainText("60%");
});
