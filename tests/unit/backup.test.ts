import { describe, it, expect } from "vitest";
import { parseBackupJson, isValidBackupData } from "../../src/lrc/backup";

describe("parseBackupJson", () => {
  it("parses a valid JSON string into an object", () => {
    const input = JSON.stringify({ metadata: {}, timings: [] });
    const result = parseBackupJson(input);
    expect(result).toEqual({ metadata: {}, timings: [] });
  });

  it("returns null for invalid JSON", () => {
    expect(parseBackupJson("{broken json")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(parseBackupJson(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(parseBackupJson(undefined)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseBackupJson("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(parseBackupJson("   ")).toBeNull();
  });

  it("returns null for a number input", () => {
    expect(parseBackupJson(42)).toBeNull();
  });

  it("parses nested objects correctly", () => {
    const input = JSON.stringify({
      metadata: { ar: "Artist" },
      timings: [{ ts: "1:00.000", str: "Hello" }],
    });
    const result = parseBackupJson(input) as {
      metadata: { ar: string };
      timings: { ts: string; str: string }[];
    };
    expect(result.metadata.ar).toBe("Artist");
    expect(result.timings[0].str).toBe("Hello");
  });
});

describe("isValidBackupData", () => {
  it("returns true for a valid backup with metadata and timings", () => {
    const data = { metadata: {}, timings: [{ ts: "1:00.000", str: "Hello" }] };
    expect(isValidBackupData(data)).toBe(true);
  });

  it("returns true for empty timings array", () => {
    expect(isValidBackupData({ metadata: {}, timings: [] })).toBe(true);
  });

  it("returns false for null", () => {
    expect(isValidBackupData(null)).toBe(false);
  });

  it("returns false for a primitive", () => {
    expect(isValidBackupData("string")).toBe(false);
    expect(isValidBackupData(42)).toBe(false);
  });

  it("returns false when metadata is missing", () => {
    expect(isValidBackupData({ timings: [] })).toBe(false);
  });

  it("returns false when timings is missing", () => {
    expect(isValidBackupData({ metadata: {} })).toBe(false);
  });

  it("returns false when metadata is null", () => {
    expect(isValidBackupData({ metadata: null, timings: [] })).toBe(false);
  });

  it("returns false when timings is not an array", () => {
    expect(isValidBackupData({ metadata: {}, timings: "not an array" })).toBe(
      false,
    );
  });

  it("returns false when timings contains an item missing 'ts'", () => {
    expect(
      isValidBackupData({ metadata: {}, timings: [{ str: "Hello" }] }),
    ).toBe(false);
  });

  it("returns false when timings contains an item missing 'str'", () => {
    expect(
      isValidBackupData({ metadata: {}, timings: [{ ts: "1:00.000" }] }),
    ).toBe(false);
  });

  it("returns false when timings contains an item with non-string ts", () => {
    expect(
      isValidBackupData({ metadata: {}, timings: [{ ts: 60, str: "Hello" }] }),
    ).toBe(false);
  });

  it("returns false when timings contains a non-object item", () => {
    expect(isValidBackupData({ metadata: {}, timings: [42] })).toBe(false);
  });
});
