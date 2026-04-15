// @vitest-environment jsdom
/**
 * End-to-end tests covering the LRC file import → parse → export flow.
 * These tests compose real LRCParser + buildLrcOutput + LRCString together
 * without touching the DOM-heavy UI layer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { setupEditorFixture } from "../fixtures/html-fixture";

vi.mock("../../src/page-props.json", () => ({
  default: {
    dialog: {
      close: "Close",
      yes: "Yes",
      no: "No",
      submit: "Submit",
      cancel: "Cancel",
      defaultTitles: {
        fail: "Error",
        success: "Success",
        wait: "Wait",
        request: "Request",
        confirm: "Confirm",
        info: "Info",
      },
      defaultContent: {
        fail: "Fail",
        success: "Success",
        wait: "Wait",
        request: "Request",
        confirm: "Confirm?",
        info: "Info",
      },
    },
    jsLocales: {
      confirm_navigation: "Leave?",
      dialog_edit_meta: "Edit metadata",
      dialog_edit_meta_reset_btn: "Reset",
      dialog_edit_meta_reset_info: "Reset info",
      dialog_format_error: "Format error",
      dialog_format_notaudio: "Not audio",
      dialog_import_audio_lyrics_action: "Overwrite",
      dialog_import_audio_lyrics_info: "Lyrics found",
      dialog_import_audio_lyrics_title: "Import lyrics",
      dialog_parse_error: "Parse error",
      dialog_parse_error_empty: "File is empty",
      dialog_parse_error_no_timing: "No timing data",
      dialog_pasteraw_action: "Import",
      dialog_pasteraw_info: "Paste info",
      dialog_pasteraw_title: "Paste lyrics",
      player_nofile: "No file",
      timing_export_audio: "Export audio",
      save: "Save",
      backup_load_error: "Backup failed",
      metadata_field_placeholders: {
        artist: "Artist",
        album: "Album",
        title: "Title",
        lyrics_author: "Lyrics by",
        length: "Length",
        file_author: "File author",
        offset: "Offset",
        created_with: "Created with",
        version: "Version",
      },
    },
  },
}));

vi.mock("file-saver", () => ({ saveAs: vi.fn() }));
vi.mock("blob-polyfill", () => ({ Blob: globalThis.Blob }));
vi.mock("../../src/dialog", () => ({
  Dialog: {
    request: vi.fn(),
    confirm: vi.fn(),
    fail: vi.fn(),
    info: vi.fn(),
    wait: vi.fn(),
    close: vi.fn(),
  },
}));

const sampleLrcPath = resolve(__dirname, "../fixtures/sample.lrc");
const sampleLrc = readFileSync(sampleLrcPath, "utf8");

describe("LRC file import → parse", () => {
  it("parses the sample.lrc fixture and returns the correct number of timing entries", async () => {
    const { LRCParser } = await import("../../src/lrc/LRCParser");
    const parser = new LRCParser(sampleLrc);
    expect(parser.timings).toHaveLength(7);
  });

  it("sorts parsed timings by timestamp ascending", async () => {
    const { LRCParser } = await import("../../src/lrc/LRCParser");
    const parser = new LRCParser(sampleLrc);
    for (let i = 1; i < parser.timings.length; i++) {
      expect(parser.timings[i].ts.seconds).toBeGreaterThanOrEqual(
        parser.timings[i - 1].ts.seconds,
      );
    }
  });

  it("extracts correct metadata from the sample file", async () => {
    const { LRCParser } = await import("../../src/lrc/LRCParser");
    const parser = new LRCParser(sampleLrc);
    expect(parser.metadata.ar).toBe("Test Artist");
    expect(parser.metadata.ti).toBe("Sample Song");
    expect(parser.metadata.al).toBe("Test Album");
    expect(parser.metadata.length).toBe("3:30");
  });

  it("handles CRLF line endings", async () => {
    const { LRCParser } = await import("../../src/lrc/LRCParser");
    const crlf = sampleLrc.replace(/\n/g, "\r\n");
    const parser = new LRCParser(crlf);
    expect(parser.timings).toHaveLength(7);
  });
});

describe("LRC round-trip: parse → export → parse", () => {
  it("produces the same timings after a full round-trip", async () => {
    const { LRCParser } = await import("../../src/lrc/LRCParser");
    const { buildLrcOutput } = await import("../../src/lrc/lrcExport");

    const first = new LRCParser(sampleLrc);
    const exported = buildLrcOutput(first.timings, {}, false, false);
    const second = new LRCParser(exported);

    expect(second.timings).toHaveLength(first.timings.length);
    for (let i = 0; i < first.timings.length; i++) {
      expect(second.timings[i].ts.seconds).toBeCloseTo(
        first.timings[i].ts.seconds,
        3,
      );
      expect(second.timings[i].str).toBe(first.timings[i].str);
    }
  });

  it("preserves metadata through a round-trip with metadata included", async () => {
    const { LRCParser } = await import("../../src/lrc/LRCParser");
    const { buildLrcOutput } = await import("../../src/lrc/lrcExport");

    const first = new LRCParser(sampleLrc);
    const metadata: Record<string, string> = {};
    Object.entries(first.metadata).forEach(([k, v]) => {
      if (v) metadata[k] = v;
    });
    const exported = buildLrcOutput(first.timings, metadata, false, true);
    const second = new LRCParser(exported);

    expect(second.metadata.ar).toBe(first.metadata.ar);
    expect(second.metadata.ti).toBe(first.metadata.ti);
    expect(second.metadata.al).toBe(first.metadata.al);
  });
});

describe("import raw text via TimingEditor", () => {
  const mockPlayer = {
    updateEntrySticks: vi.fn(),
    getPlaybackPosition: vi.fn().mockReturnValue(undefined),
    getFileName: vi.fn().mockReturnValue(""),
    hasFile: vi.fn().mockReturnValue(false),
    resetInitialMetadata: vi.fn(),
    disableModeButton: vi.fn(),
  };

  beforeEach(() => {
    setupEditorFixture();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.resetModules();
  });

  it("imports LRC content (forcePlaintext=false) and produces timed entries", async () => {
    const { TimingEditor } = await import("../../src/lrc/TimingEditor");
    const editor = new TimingEditor({ player: mockPlayer } as never);
    editor.importFromText(sampleLrc, false);
    const timings = editor.getTimings();
    expect(timings.length).toBeGreaterThan(0);
    expect(timings[0].ts.valid).toBe(true);
  });

  it("imports plaintext lyrics and creates one entry per line plus a trailing break", async () => {
    const { TimingEditor } = await import("../../src/lrc/TimingEditor");
    const editor = new TimingEditor({ player: mockPlayer } as never);
    const lyrics = "Line one\nLine two\nLine three";
    editor.importFromText(lyrics, true);
    expect(editor.getTimings()).toHaveLength(4); // 3 lines + trailing empty
  });
});
