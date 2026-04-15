import { describe, it, expect } from "vitest";
import { LRCString } from "../../src/lrc/LRCString";
import { Duration } from "../../src/lrc/Duration";

describe("LRCString", () => {
  describe("constructor with string input", () => {
    it("trims the string", () => {
      const ls = new LRCString("  hello  ", "1:00");
      expect(ls.str).toBe("hello");
    });

    it("parses string timestamp into a Duration", () => {
      const ls = new LRCString("Hello", "1:23.456");
      expect(ls.ts.valid).toBe(true);
      expect(ls.ts.seconds).toBe(83.456);
    });

    it("accepts a Duration instance directly for ts", () => {
      const dur = new Duration(90);
      const ls = new LRCString("Hello", dur);
      expect(ls.ts).toBe(dur);
    });

    it("sets ts to an invalid Duration when ts is null", () => {
      const ls = new LRCString("Hello", null);
      expect(ls.ts.valid).toBe(false);
    });

    it("stores domNode as null when not provided", () => {
      const ls = new LRCString("Hello", "1:00");
      expect(ls.$domNode).toBeNull();
    });

    it("defaults str to empty string and ts to invalid Duration when called with no args", () => {
      const ls = new LRCString();
      expect(ls.str).toBe("");
      expect(ls.ts.valid).toBe(false);
    });
  });

  describe("constructor with LRCStringJsonValue input", () => {
    it("reads str from the .str field", () => {
      const ls = new LRCString({ ts: "1:00.000", str: "Lyric line" });
      expect(ls.str).toBe("Lyric line");
    });

    it("parses ts from the .ts field via new Duration()", () => {
      const ls = new LRCString({ ts: "1:00.000", str: "Lyric line" });
      expect(ls.ts.valid).toBe(true);
      expect(ls.ts.seconds).toBe(60);
    });
  });

  describe("toJsonValue", () => {
    it("returns an object with ts string and str string", () => {
      const ls = new LRCString("Hello", "1:23.456");
      const json = ls.toJsonValue();
      expect(json).toEqual({ ts: "1:23.456", str: "Hello" });
    });

    it("ts uses Duration.toString() result (no forced minute padding)", () => {
      const ls = new LRCString("Hello", "1:05.000");
      expect(ls.toJsonValue().ts).toBe("1:05.000");
    });

    it("returns empty ts string for an invalid Duration", () => {
      const ls = new LRCString("Hello", null);
      expect(ls.toJsonValue().ts).toBe("");
    });
  });

  describe("isValidJsonData", () => {
    it("returns true for a valid { ts, str } object", () => {
      expect(LRCString.isValidJsonData({ ts: "1:00.000", str: "Hello" })).toBe(
        true,
      );
    });

    it("returns true when both fields are empty strings", () => {
      expect(LRCString.isValidJsonData({ ts: "", str: "" })).toBe(true);
    });

    it("returns false for null", () => {
      expect(LRCString.isValidJsonData(null)).toBe(false);
    });

    it("returns false for a primitive", () => {
      expect(LRCString.isValidJsonData("string")).toBe(false);
      expect(LRCString.isValidJsonData(42)).toBe(false);
    });

    it("returns false when ts is missing", () => {
      expect(LRCString.isValidJsonData({ str: "Hello" })).toBe(false);
    });

    it("returns false when str is missing", () => {
      expect(LRCString.isValidJsonData({ ts: "1:00.000" })).toBe(false);
    });

    it("returns false when ts is not a string", () => {
      expect(LRCString.isValidJsonData({ ts: 123, str: "Hello" })).toBe(false);
    });

    it("returns false when str is not a string", () => {
      expect(LRCString.isValidJsonData({ ts: "1:00.000", str: 123 })).toBe(
        false,
      );
    });
  });
});
