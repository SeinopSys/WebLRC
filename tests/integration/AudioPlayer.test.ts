// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupPlayerFixture } from "../fixtures/html-fixture";

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
      dialog_format_error: "Format error",
      dialog_format_notaudio: "Not audio",
      dialog_import_audio_lyrics_action: "Overwrite",
      dialog_import_audio_lyrics_info: "Lyrics found",
      dialog_import_audio_lyrics_title: "Import lyrics",
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

vi.mock("../../src/dialog", () => ({
  Dialog: {
    fail: vi.fn(),
    info: vi.fn(),
    request: vi.fn(),
    confirm: vi.fn(),
    wait: vi.fn(),
    close: vi.fn(),
  },
}));

// Mock heavy media tag libraries — we only test the tag-setting methods directly
vi.mock("mp3tag.js", () => ({ default: vi.fn() }));
vi.mock("jsmediatags/dist/jsmediatags.min", () => ({ Reader: vi.fn() }));

const mockEditor = {
  setInitialMetadata: vi.fn(),
  hlEntry: vi.fn(),
  getTimings: vi.fn().mockReturnValue([]),
  disableModeButton: vi.fn(),
};

async function createPlayer() {
  const { AudioPlayer } = await import("../../src/lrc/AudioPlayer");
  return new AudioPlayer({ editor: mockEditor } as never);
}

describe("AudioPlayer", () => {
  beforeEach(() => {
    setupPlayerFixture();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.resetModules();
  });

  describe("getSessionVolume", () => {
    it("returns 0.5 when localStorage has no value", async () => {
      const { AudioPlayer } = await import("../../src/lrc/AudioPlayer");
      expect(AudioPlayer.getSessionVolume()).toBe(0.5);
    });

    it("returns the stored float value from localStorage", async () => {
      localStorage.setItem("lrc-vol", "0.7");
      const { AudioPlayer } = await import("../../src/lrc/AudioPlayer");
      expect(AudioPlayer.getSessionVolume()).toBe(0.7);
    });

    it("returns NaN-parsed float when stored value is non-numeric (parseFloat fallback)", async () => {
      // Note: the production code checks Number.isNaN(stored) where stored is a string.
      // Number.isNaN("abc") is always false for strings (unlike isNaN("abc") which is true).
      // So "abc" is not treated as missing; parseFloat("abc") = NaN is returned as volume.
      localStorage.setItem("lrc-vol", "abc");
      const { AudioPlayer } = await import("../../src/lrc/AudioPlayer");
      const vol = AudioPlayer.getSessionVolume();
      expect(Number.isNaN(vol)).toBe(true);
    });

    it("stores '0.5' in localStorage when no value was present", async () => {
      const { AudioPlayer } = await import("../../src/lrc/AudioPlayer");
      AudioPlayer.getSessionVolume();
      expect(localStorage.getItem("lrc-vol")).toBe("0.5");
    });
  });

  describe("setMp3MediaTags", () => {
    it("throws TypeError when tags is not an object", async () => {
      const player = await createPlayer();
      expect(() =>
        (
          player as never as { setMp3MediaTags: (t: unknown) => void }
        ).setMp3MediaTags("not an object"),
      ).toThrow();
    });

    it("correctly sets album, artist, and title from MP3 tags", async () => {
      const player = await createPlayer();
      (
        player as never as { setMp3MediaTags: (t: object) => void }
      ).setMp3MediaTags({
        album: "Test Album",
        artist: "Test Artist",
        title: "Test Title",
      });
      expect(player.getFileName()).toBe("Test Artist - Test Title");
    });

    it("extracts lyrics from tags.v2.USLT[0].text", async () => {
      const player = await createPlayer();
      (
        player as never as { setMp3MediaTags: (t: object) => void }
      ).setMp3MediaTags({
        artist: "Artist",
        title: "Title",
        album: "Album",
        v2: {
          USLT: [{ text: "Lyric content", language: "eng", descriptor: "" }],
        },
      });
      // Lyrics should have been passed to editor.setInitialMetadata
      expect(mockEditor.setInitialMetadata).toHaveBeenCalledWith(
        expect.objectContaining({ lyrics: "Lyric content" }),
      );
    });
  });

  describe("setAudioMediaTags", () => {
    it("throws TypeError when tags is not an object", async () => {
      const player = await createPlayer();
      expect(() =>
        (
          player as never as { setAudioMediaTags: (t: unknown) => void }
        ).setAudioMediaTags("not an object"),
      ).toThrow();
    });

    it("correctly sets artist and title from jsmediatags format", async () => {
      const player = await createPlayer();
      (
        player as never as { setAudioMediaTags: (t: object) => void }
      ).setAudioMediaTags({
        artist: "JS Artist",
        title: "JS Title",
        album: "JS Album",
      });
      expect(player.getFileName()).toBe("JS Artist - JS Title");
    });
  });

  describe("getFileName", () => {
    it("returns 'Artist - Title' when both are set", async () => {
      const player = await createPlayer();
      (
        player as never as { setMp3MediaTags: (t: object) => void }
      ).setMp3MediaTags({
        artist: "Test Artist",
        title: "Test Song",
      });
      expect(player.getFileName()).toBe("Test Artist - Test Song");
    });

    it("returns just the title when artist is not set", async () => {
      const player = await createPlayer();
      (
        player as never as { setMp3MediaTags: (t: object) => void }
      ).setMp3MediaTags({
        title: "Just a Title",
      });
      expect(player.getFileName()).toBe("Just a Title");
    });
  });

  describe("getFileExtension", () => {
    it("returns bin as fallback when no file is loaded", async () => {
      const player = await createPlayer();
      expect(player.getFileExtension()).toBe("bin");
    });
  });
});
