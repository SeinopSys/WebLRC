// @vitest-environment jsdom
/**
 * End-to-end tests for the backup/restore workflow.
 * Tests the full cycle: create backup → validate → restore → verify state.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

const mockPlayer = {
  updateEntrySticks: vi.fn(),
  getPlaybackPosition: vi.fn().mockReturnValue(undefined),
  getFileName: vi.fn().mockReturnValue(""),
  hasFile: vi.fn().mockReturnValue(false),
  resetInitialMetadata: vi.fn(),
  disableModeButton: vi.fn(),
};

describe("Backup validation (pure functions)", () => {
  it("parseBackupJson handles valid JSON strings", async () => {
    const { parseBackupJson } = await import("../../src/lrc/backup");
    const data = { metadata: {}, timings: [{ ts: "1:00.000", str: "Hello" }] };
    expect(parseBackupJson(JSON.stringify(data))).toEqual(data);
  });

  it("isValidBackupData returns true for well-formed backup", async () => {
    const { isValidBackupData } = await import("../../src/lrc/backup");
    expect(
      isValidBackupData({
        metadata: {},
        timings: [{ ts: "1:00.000", str: "Hello" }],
      }),
    ).toBe(true);
  });

  it("isValidBackupData returns false for backup with corrupted timings", async () => {
    const { isValidBackupData } = await import("../../src/lrc/backup");
    expect(isValidBackupData({ metadata: {}, timings: [{ notTs: "x" }] })).toBe(
      false,
    );
  });
});

describe("TimingEditor backup/restore round-trip", () => {
  beforeEach(() => {
    setupEditorFixture();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.resetModules();
  });

  it("createBackup produces JSON that passes isValidBackupData", async () => {
    const { TimingEditor } = await import("../../src/lrc/TimingEditor");
    const { isValidBackupData, parseBackupJson } =
      await import("../../src/lrc/backup");
    const editor = new TimingEditor({ player: mockPlayer } as never);
    editor.importFromText("[0:05.000]Lyric\n[0:10.000]Another", false);

    // createBackup is private — access via the stored localStorage backup mechanism
    // Trigger it via the window beforeunload event
    const backupFn = (editor as unknown as { createBackup: () => string })
      .createBackup;
    const backup = backupFn.call(editor);
    const parsed = parseBackupJson(backup);
    expect(isValidBackupData(parsed)).toBe(true);
  });

  it("backup includes all timings including entries with empty timestamps (backup=true mode)", async () => {
    const { TimingEditor } = await import("../../src/lrc/TimingEditor");
    const editor = new TimingEditor({ player: mockPlayer } as never);
    // importFromText adds entries without timestamps
    editor.importFromText("Line without timestamp", true);

    const backupFn = (editor as unknown as { createBackup: () => string })
      .createBackup;
    const backup = JSON.parse(backupFn.call(editor));
    // In backup mode storeTimings(true) includes entries without valid timestamps
    expect(backup.timings.length).toBeGreaterThan(0);
  });

  it("full round-trip: set timings → createBackup → importBackup → same timings", async () => {
    const { TimingEditor } = await import("../../src/lrc/TimingEditor");
    const editor1 = new TimingEditor({ player: mockPlayer } as never);
    editor1.importFromText("[0:05.000]Hello\n[0:10.000]World", false);
    const originalTimings = editor1.getTimings().map((t) => ({
      str: t.str,
      seconds: t.ts.seconds,
    }));

    const createBackupFn = (
      editor1 as unknown as { createBackup: () => string }
    ).createBackup;
    const backup = createBackupFn.call(editor1);

    // Fresh editor restores from backup
    setupEditorFixture();
    const editor2 = new TimingEditor({ player: mockPlayer } as never);
    const importBackupFn = (
      editor2 as unknown as { importBackup: (s: string) => void }
    ).importBackup;
    importBackupFn.call(editor2, backup);

    const restoredTimings = editor2.getTimings().map((t) => ({
      str: t.str,
      seconds: t.ts.seconds,
    }));
    expect(restoredTimings).toEqual(originalTimings);
  });

  it("importBackup restores metadata fields", async () => {
    const { TimingEditor } = await import("../../src/lrc/TimingEditor");
    const editor1 = new TimingEditor({ player: mockPlayer } as never);
    editor1.importFromText("[0:05.000]Line", false);
    editor1.setMetadata({ ar: "My Artist" } as never);

    const createBackupFn = (
      editor1 as unknown as { createBackup: () => string }
    ).createBackup;
    const backup = createBackupFn.call(editor1);

    setupEditorFixture();
    const editor2 = new TimingEditor({ player: mockPlayer } as never);
    const importBackupFn = (
      editor2 as unknown as { importBackup: (s: string) => void }
    ).importBackup;
    importBackupFn.call(editor2, backup);

    expect(editor2.getCurrentMetadata().ar).toBe("My Artist");
  });

  it("importBackup throws when given malformed JSON", async () => {
    const { TimingEditor } = await import("../../src/lrc/TimingEditor");
    const editor = new TimingEditor({ player: mockPlayer } as never);
    const importBackupFn = (
      editor as unknown as { importBackup: (s: string) => void }
    ).importBackup;
    expect(() => importBackupFn.call(editor, "{bad json")).toThrow();
  });
});

describe("Metadata operations", () => {
  beforeEach(() => {
    setupEditorFixture();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.resetModules();
  });

  it("getCurrentMetadata merges initialMetadata and user metadata, user values win", async () => {
    const { TimingEditor } = await import("../../src/lrc/TimingEditor");
    const editor = new TimingEditor({ player: mockPlayer } as never);
    // re and ve come from initialMetadata; ar is user-set
    editor.setMetadata({ ar: "User Artist" } as never);
    const merged = editor.getCurrentMetadata();
    expect(merged.ar).toBe("User Artist");
    expect(merged.re).toBeDefined(); // from initialMetadata
  });

  it("metadata badge shows empty string when only initialMetadata is set", async () => {
    const { TimingEditor } = await import("../../src/lrc/TimingEditor");
    const editor = new TimingEditor({ player: mockPlayer } as never);
    editor.setMetadata({} as never);
    const badge = document.querySelector(".metadata-count");
    expect(badge?.textContent).toBe("");
  });

  it("metadata badge increments when a user key is set", async () => {
    const { TimingEditor } = await import("../../src/lrc/TimingEditor");
    const editor = new TimingEditor({ player: mockPlayer } as never);
    editor.setMetadata({ ar: "Artist", ti: "Title" } as never);
    const badge = document.querySelector(".metadata-count");
    expect(badge?.textContent).toBe("2");
  });
});
