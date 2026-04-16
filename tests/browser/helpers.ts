import type { Page } from "@playwright/test";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
export const SAMPLE_LRC_PATH = resolve(__dirname, "../fixtures/sample.lrc");

/** Wait for the editor to be ready. */
export async function waitForEditor(page: Page) {
  await page.locator(".editor").waitFor();
}

/** Navigate to the app and wait for the editor to be ready. */
export async function gotoApp(page: Page) {
  await page.goto("/");
  await waitForEditor(page);
}

/** Wait for a Bootstrap dialog to finish opening (`.show` class applied). */
export async function waitForDialog(page: Page) {
  await page.locator("#dialogOverlay.show").waitFor();
}

/** Wait for the currently-open Bootstrap dialog to be fully hidden. */
export async function waitForDialogClosed(page: Page) {
  await page.locator("#dialogOverlay").waitFor({ state: "hidden" });
}

/** Click a dialog button by its visible text. */
export async function clickDialogButton(page: Page, text: string) {
  await page.locator(`#dialogButtons button:has-text("${text}")`).click();
}

/**
 * Generate a minimal silent WAV buffer (1 channel, 44100 Hz, 16-bit, 1 sample).
 * This is the smallest valid WAV file a browser will accept.
 */
export function createSilentWav(): Buffer {
  const buf = Buffer.alloc(46);
  let o = 0;
  buf.write("RIFF", o);
  o += 4;
  buf.writeUInt32LE(38, o);
  o += 4; // file size − 8
  buf.write("WAVE", o);
  o += 4;
  buf.write("fmt ", o);
  o += 4;
  buf.writeUInt32LE(16, o);
  o += 4; // fmt chunk size
  buf.writeUInt16LE(1, o);
  o += 2; // PCM
  buf.writeUInt16LE(1, o);
  o += 2; // mono
  buf.writeUInt32LE(44100, o);
  o += 4; // sample rate
  buf.writeUInt32LE(88200, o);
  o += 4; // byte rate
  buf.writeUInt16LE(2, o);
  o += 2; // block align
  buf.writeUInt16LE(16, o);
  o += 2; // bits per sample
  buf.write("data", o);
  o += 4;
  buf.writeUInt32LE(2, o);
  o += 4; // data size
  buf.writeInt16LE(0, o); // 1 silent 16-bit sample
  return buf;
}

/** Upload the silent WAV fixture via the hidden audio file input. */
export async function loadSilentAudio(page: Page) {
  await page.locator("#audiofilein").setInputFiles({
    name: "silence.wav",
    mimeType: "audio/wav",
    buffer: createSilentWav(),
  });
  // Wait for the play button to become enabled (loadeddata fired)
  await page.locator("#playbackbtn:not([disabled])").waitFor();
}
