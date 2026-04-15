import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/page-props.json", () => ({
  default: {
    dialog: {
      close: "Close",
      yes: "Yes",
      no: "No",
      submit: "Submit",
      cancel: "Cancel",
      defaultTitles: {},
      defaultContent: {},
    },
    jsLocales: {
      dialog_parse_error_empty: "The specified file is empty",
      dialog_parse_error_no_timing:
        "The specified file contains no timing data",
    },
  },
}));

import { LRCParser } from "../../src/lrc/LRCParser";

describe("LRCParser", () => {
  describe("error cases", () => {
    it("throws on empty string input", () => {
      expect(() => new LRCParser("")).toThrow("The specified file is empty");
    });

    it("throws on whitespace-only input", () => {
      expect(() => new LRCParser("   \n  ")).toThrow(
        "The specified file is empty",
      );
    });

    it("throws when file has only metadata lines (no timings)", () => {
      expect(() => new LRCParser("[ar:Artist]\n[ti:Title]\n")).toThrow(
        "The specified file contains no timing data",
      );
    });

    it("throws when file has only plain text lines", () => {
      expect(() => new LRCParser("some text\nmore text\n")).toThrow(
        "The specified file contains no timing data",
      );
    });
  });

  describe("parsing timings", () => {
    it("parses a single timing line", () => {
      const p = new LRCParser("[1:23.456]Hello");
      expect(p.timings).toHaveLength(1);
      expect(p.timings[0].str).toBe("Hello");
      expect(p.timings[0].ts.seconds).toBe(83.456);
    });

    it("strips the timestamp bracket from text", () => {
      const p = new LRCParser("[0:05.000]Lyric text");
      expect(p.timings[0].str).toBe("Lyric text");
    });

    it("parses multiple timing lines", () => {
      const content = "[0:05.000]First\n[0:10.000]Second\n[0:15.000]Third";
      const p = new LRCParser(content);
      expect(p.timings).toHaveLength(3);
    });

    it("sorts timings by timestamp ascending regardless of input order", () => {
      const content = "[0:30.000]Third\n[0:10.000]First\n[0:20.000]Second";
      const p = new LRCParser(content);
      expect(p.timings[0].str).toBe("First");
      expect(p.timings[1].str).toBe("Second");
      expect(p.timings[2].str).toBe("Third");
    });

    it("handles multiple timestamps on a single line", () => {
      const p = new LRCParser("[1:00.000][2:00.000]Hello");
      expect(p.timings).toHaveLength(2);
      expect(p.timings[0].str).toBe("Hello");
      expect(p.timings[1].str).toBe("Hello");
      expect(p.timings[0].ts.seconds).toBe(60);
      expect(p.timings[1].ts.seconds).toBe(120);
    });

    it("handles empty lyric text (break entry)", () => {
      const p = new LRCParser("[1:00.000]");
      expect(p.timings[0].str).toBe("");
    });

    it("trims whitespace from lyric text", () => {
      const p = new LRCParser("[1:00.000]  spaced  ");
      expect(p.timings[0].str).toBe("spaced");
    });

    it("handles Windows CRLF line endings", () => {
      const content = "[0:05.000]First\r\n[0:10.000]Second\r\n";
      const p = new LRCParser(content);
      expect(p.timings).toHaveLength(2);
    });

    it("ignores plain text lines (no timing or metadata)", () => {
      const content =
        "[0:05.000]Lyric\nThis is a plain text line\n[0:10.000]Another";
      const p = new LRCParser(content);
      expect(p.timings).toHaveLength(2);
    });
  });

  describe("parsing metadata", () => {
    it("parses [ar:...] into metadata.ar", () => {
      const p = new LRCParser("[ar:Test Artist]\n[0:01.000]Line");
      expect(p.metadata.ar).toBe("Test Artist");
    });

    it("parses [ti:...] into metadata.ti", () => {
      const p = new LRCParser("[ti:My Song]\n[0:01.000]Line");
      expect(p.metadata.ti).toBe("My Song");
    });

    it("parses [al:...] into metadata.al", () => {
      const p = new LRCParser("[al:My Album]\n[0:01.000]Line");
      expect(p.metadata.al).toBe("My Album");
    });

    it("trims the length metadata value", () => {
      const p = new LRCParser("[length: 3:45 ]\n[0:01.000]Line");
      expect(p.metadata.length).toBe("3:45");
    });

    it("preserves whitespace in non-length metadata", () => {
      const p = new LRCParser("[ar: Test Artist ]\n[0:01.000]Line");
      // LRC_META_REGEX captures everything after the colon except the closing bracket
      expect(p.metadata.ar).toBe(" Test Artist ");
    });

    it("ignores unknown metadata tags", () => {
      const p = new LRCParser("[xx:unknown]\n[0:01.000]Line");
      expect((p.metadata as Record<string, string>).xx).toBeUndefined();
    });

    it("handles a file with both metadata and timings", () => {
      const content =
        "[ar:Artist]\n[ti:Title]\n[0:05.000]Lyric\n[0:10.000]Lyric 2";
      const p = new LRCParser(content);
      expect(p.metadata.ar).toBe("Artist");
      expect(p.metadata.ti).toBe("Title");
      expect(p.timings).toHaveLength(2);
    });

    it("initializes metadata as an empty object when no metadata is present", () => {
      const p = new LRCParser("[0:01.000]Just a lyric");
      expect(Object.keys(p.metadata)).toHaveLength(0);
    });
  });
});
