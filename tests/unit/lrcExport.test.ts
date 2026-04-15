import { describe, it, expect } from "vitest";
import { buildLrcOutput } from "../../src/lrc/lrcExport";
import { LRCString } from "../../src/lrc/LRCString";

function makeTiming(str: string, ts: string): LRCString {
  return new LRCString(str, ts);
}

describe("buildLrcOutput", () => {
  // Note: buildLrcOutput uses Duration.toString(true) which pads minutes to 2 digits.
  // e.g. 5 seconds → "00:05.000", 65 seconds → "01:05.000"

  describe("basic output", () => {
    it("formats a single timing as [MM:SS.mmm]text with trailing newline (minutes padded)", () => {
      const timings = [makeTiming("Hello", "1:00.000")];
      const output = buildLrcOutput(timings, {}, false);
      expect(output).toBe("[01:00.000]Hello\n");
    });

    it("always ends with a newline", () => {
      const timings = [makeTiming("Hello", "0:05.000")];
      const output = buildLrcOutput(timings, {}, false);
      expect(output.endsWith("\n")).toBe(true);
    });

    it("formats multiple timings, one per line (minutes padded)", () => {
      const timings = [
        makeTiming("First", "0:05.000"),
        makeTiming("Second", "0:10.000"),
      ];
      const output = buildLrcOutput(timings, {}, false);
      expect(output).toBe("[00:05.000]First\n[00:10.000]Second\n");
    });

    it("handles break entries (empty text)", () => {
      const timings = [makeTiming("", "0:05.000")];
      const output = buildLrcOutput(timings, {}, false);
      expect(output).toBe("[00:05.000]\n");
    });
  });

  describe("merged output strategy", () => {
    it("merges duplicate lyric strings onto one line with multiple timestamps", () => {
      const timings = [
        makeTiming("Hello", "1:00.000"),
        makeTiming("Hello", "2:00.000"),
      ];
      const output = buildLrcOutput(timings, {}, true);
      expect(output).toBe("[01:00.000][02:00.000]Hello\n");
    });

    it("does not merge when strategy is false", () => {
      const timings = [
        makeTiming("Hello", "1:00.000"),
        makeTiming("Hello", "2:00.000"),
      ];
      const output = buildLrcOutput(timings, {}, false);
      expect(output).toBe("[01:00.000]Hello\n[02:00.000]Hello\n");
    });

    it("keeps unique strings separate even in merged mode", () => {
      const timings = [
        makeTiming("First", "0:05.000"),
        makeTiming("Second", "0:10.000"),
      ];
      const output = buildLrcOutput(timings, {}, true);
      expect(output).toContain("[00:05.000]First");
      expect(output).toContain("[00:10.000]Second");
    });
  });

  describe("metadata output", () => {
    it("includes [ar:...] and [ti:...] metadata lines when includeMetadata=true", () => {
      const metadata = { ar: "Artist Name", ti: "Song Title" };
      const timings = [makeTiming("Hello", "0:05.000")];
      const output = buildLrcOutput(timings, metadata, false, true);
      expect(output).toContain("[ar:Artist Name]");
      expect(output).toContain("[ti:Song Title]");
    });

    it("excludes metadata lines when includeMetadata=false", () => {
      const metadata = { ar: "Artist Name" };
      const timings = [makeTiming("Hello", "0:05.000")];
      const output = buildLrcOutput(timings, metadata, false, false);
      expect(output).not.toContain("[ar:");
    });

    it("skips offset metadata when value is '0'", () => {
      const metadata = { offset: "0" };
      const timings = [makeTiming("Hello", "0:05.000")];
      const output = buildLrcOutput(timings, metadata, false, true);
      expect(output).not.toContain("[offset:");
    });

    it("includes offset metadata when value is non-zero", () => {
      const metadata = { offset: "500" };
      const timings = [makeTiming("Hello", "0:05.000")];
      const output = buildLrcOutput(timings, metadata, false, true);
      expect(output).toContain("[offset:500]");
    });

    it("prefixes length value with a space character", () => {
      const metadata = { length: "3:45" };
      const timings = [makeTiming("Hello", "0:05.000")];
      const output = buildLrcOutput(timings, metadata, false, true);
      expect(output).toContain("[length: 3:45]");
    });

    it("skips empty metadata values", () => {
      const metadata = { ar: "", ti: "Title" };
      const timings = [makeTiming("Hello", "0:05.000")];
      const output = buildLrcOutput(timings, metadata, false, true);
      expect(output).not.toContain("[ar:]");
      expect(output).toContain("[ti:Title]");
    });
  });
});
