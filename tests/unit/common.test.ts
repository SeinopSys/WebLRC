import { describe, it, expect } from "vitest";
import {
  binarySearch,
  floatToPercent,
  LRC_TS_REGEX,
  LRC_META_REGEX,
  LRC_META_TAGS,
} from "../../src/lrc/common";

describe("binarySearch", () => {
  it("finds an exact element in a sorted array", () => {
    const arr = [1, 3, 5, 7];
    expect(binarySearch(arr, (v) => v - 5)).toBe(2);
  });

  it("returns the index of the nearest left element when not found", () => {
    const arr = [1, 3, 5, 7];
    // 4 is between index 1 (3) and index 2 (5) → nearest left is index 1
    expect(binarySearch(arr, (v) => v - 4)).toBe(1);
  });

  it("returns -1 when the search value is before all elements", () => {
    const arr = [3, 5, 7];
    expect(binarySearch(arr, (v) => v - 1)).toBe(-1);
  });

  it("returns -1 for an empty array", () => {
    expect(binarySearch([], () => -1)).toBe(-1);
  });

  it("returns 0 when single-element array matches", () => {
    expect(binarySearch([5], (v) => v - 5)).toBe(0);
  });

  it("returns -1 when single-element array value is greater than target", () => {
    expect(binarySearch([10], (v) => v - 3)).toBe(-1);
  });

  it("returns 0 (nearest left) when single-element array value is less than target", () => {
    expect(binarySearch([1], (v) => v - 5)).toBe(0);
  });

  it("works with LRCString-like objects sorted by seconds", () => {
    const entries = [
      { ts: { seconds: 5 } },
      { ts: { seconds: 10 } },
      { ts: { seconds: 15 } },
    ];
    const position = 12;
    const result = binarySearch(entries, (n) => n.ts.seconds - position);
    // 12 is between index 1 (10) and index 2 (15) → nearest left is 1
    expect(result).toBe(1);
    expect(entries[result].ts.seconds).toBe(10);
  });
});

describe("floatToPercent", () => {
  it("converts 0.5 to 50%", () => {
    expect(floatToPercent(0.5)).toBe("50%");
  });

  it("converts 0 to 0%", () => {
    expect(floatToPercent(0)).toBe("0%");
  });

  it("converts 1 to 100%", () => {
    expect(floatToPercent(1)).toBe("100%");
  });

  it("rounds to 5 decimal places before multiplying by 100", () => {
    // roundTo(0.12345678, 5) = 0.12346; * 100 = 12.346%
    expect(floatToPercent(0.12345678)).toBe("12.346%");
  });

  it("handles very small floats without scientific notation", () => {
    expect(floatToPercent(0.001)).toBe("0.1%");
  });
});

describe("LRC_TS_REGEX", () => {
  it("matches a single timestamp", () => {
    const match = "[1:23.456]Hello".match(LRC_TS_REGEX);
    expect(match).not.toBeNull();
    expect(match![0]).toBe("[1:23.456]");
  });

  it("matches multiple timestamps on one line", () => {
    const matches = "[1:00.000][2:00.000]Hello".match(LRC_TS_REGEX);
    expect(matches).toHaveLength(2);
  });

  it("does not match metadata tags like [ar:Artist]", () => {
    const match = "[ar:Test Artist]".match(LRC_TS_REGEX);
    expect(match).toBeNull();
  });

  it("is a global regex (g flag)", () => {
    expect(LRC_TS_REGEX.flags).toContain("g");
  });

  it("captures the bracket-wrapped timestamp including brackets", () => {
    const line = "[0:05.000]Line";
    LRC_TS_REGEX.lastIndex = 0;
    const match = LRC_TS_REGEX.exec(line);
    expect(match![0]).toBe("[0:05.000]");
  });
});

describe("LRC_META_REGEX", () => {
  it("matches [ar:Artist Name]", () => {
    const match = "[ar:Test Artist]".match(LRC_META_REGEX);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("ar");
    expect(match![2]).toBe("Test Artist");
  });

  it("matches [ti:Song Title]", () => {
    const match = "[ti:My Song]".match(LRC_META_REGEX);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("ti");
  });

  it("matches [length:3:45]", () => {
    const match = "[length:3:45]".match(LRC_META_REGEX);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("length");
    expect(match![2]).toBe("3:45");
  });

  it("does not match timestamp lines like [1:23.456]", () => {
    expect("[1:23.456]".match(LRC_META_REGEX)).toBeNull();
  });

  it("does not match unknown tags like [xx:value]", () => {
    expect("[xx:value]".match(LRC_META_REGEX)).toBeNull();
  });

  it("captures key in group 1 and value in group 2", () => {
    const match = "[al:My Album]".match(LRC_META_REGEX);
    expect(match![1]).toBe("al");
    expect(match![2]).toBe("My Album");
  });
});

describe("LRC_META_TAGS", () => {
  it("maps ar to artist", () => expect(LRC_META_TAGS.ar).toBe("artist"));
  it("maps ti to title", () => expect(LRC_META_TAGS.ti).toBe("title"));
  it("maps al to album", () => expect(LRC_META_TAGS.al).toBe("album"));
  it("maps au to lyrics_author", () =>
    expect(LRC_META_TAGS.au).toBe("lyrics_author"));
  it("maps length to length", () =>
    expect(LRC_META_TAGS.length).toBe("length"));
  it("maps by to file_author", () =>
    expect(LRC_META_TAGS.by).toBe("file_author"));
  it("maps offset to offset", () =>
    expect(LRC_META_TAGS.offset).toBe("offset"));
  it("maps re to created_with", () =>
    expect(LRC_META_TAGS.re).toBe("created_with"));
  it("maps ve to version", () => expect(LRC_META_TAGS.ve).toBe("version"));
  it("has exactly 9 entries", () =>
    expect(Object.keys(LRC_META_TAGS)).toHaveLength(9));
});
