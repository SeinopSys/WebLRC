import { describe, it, expect } from "vitest";
import { pad, capitalize, roundTo, rangeLimit } from "../../src/utils";

describe("pad", () => {
  it("pads a short string to length 2 with '0' by default", () => {
    expect(pad("5")).toBe("05");
  });

  it("returns the string unchanged when already at target length", () => {
    expect(pad("12")).toBe("12");
  });

  it("returns the string unchanged when longer than target length", () => {
    expect(pad("123", "0", 2)).toBe("123");
  });

  it("pads from the right when fromRight=true", () => {
    expect(pad("5", "0", 3, true)).toBe("500");
  });

  it("accepts an object with toString() as the str argument", () => {
    expect(pad({ toString: () => "7" })).toBe("07");
  });

  it("pads to a custom length", () => {
    expect(pad("1", "0", 5)).toBe("00001");
  });

  it("uses a custom padding character", () => {
    expect(pad("x", "-", 4)).toBe("---x");
  });

  it("handles string len argument by parsing as integer", () => {
    expect(pad("5", "0", "3")).toBe("005");
  });

  it("falls back to length=2 for a non-numeric string len", () => {
    // parseInt("abc", 10) → NaN; isFinite(NaN) → false, isNaN(NaN) → true → localLen=2
    expect(pad("5", "0", "abc")).toBe("05");
  });
});

describe("capitalize", () => {
  it("capitalizes only the first letter by default", () => {
    expect(capitalize("hello world")).toBe("Hello world");
  });

  it("capitalizes a single character", () => {
    expect(capitalize("h")).toBe("H");
  });

  it("capitalizes all words when all=true", () => {
    expect(capitalize("hello world", true)).toBe("Hello World");
  });

  it("handles an already-capitalized string", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  it("capitalizes all words including mid-sentence uppercase when all=true", () => {
    expect(capitalize("foo BAR baz", true)).toBe("Foo BAR Baz");
  });
});

describe("roundTo", () => {
  it("rounds to 0 decimal places", () => {
    expect(roundTo(1.567, 0)).toBe(2);
  });

  it("rounds to 2 decimal places (round up)", () => {
    expect(roundTo(1.567, 2)).toBe(1.57);
  });

  it("rounds to 2 decimal places (round down)", () => {
    expect(roundTo(1.234, 2)).toBe(1.23);
  });

  it("rounds to 3 decimal places", () => {
    expect(roundTo(1.2345, 3)).toBe(1.235);
  });

  it("returns an integer unchanged when precision=0", () => {
    expect(roundTo(5, 0)).toBe(5);
  });

  it("handles negative numbers correctly", () => {
    expect(roundTo(-1.567, 2)).toBe(-1.57);
  });
});

describe("rangeLimit", () => {
  describe("clamp mode (overflow=false)", () => {
    it("clamps to max when input exceeds max", () => {
      expect(rangeLimit(15, false, 10)).toBe(10);
    });

    it("clamps to min (0) when input is below 0 (one-arg form)", () => {
      expect(rangeLimit(-1, false, 10)).toBe(0);
    });

    it("returns input unchanged when within range", () => {
      expect(rangeLimit(5, false, 10)).toBe(5);
    });

    it("accepts explicit [min, max] two-arg form", () => {
      expect(rangeLimit(5, false, 2, 8)).toBe(5);
      expect(rangeLimit(1, false, 2, 8)).toBe(2);
      expect(rangeLimit(9, false, 2, 8)).toBe(8);
    });

    it("clamps to max when input equals max", () => {
      expect(rangeLimit(10, false, 10)).toBe(10);
    });
  });

  describe("overflow/wrap mode (overflow=true)", () => {
    it("wraps to min when input exceeds max", () => {
      expect(rangeLimit(11, true, 10)).toBe(0);
    });

    it("wraps to max when input is below min", () => {
      expect(rangeLimit(-1, true, 10)).toBe(10);
    });

    it("returns input unchanged when within range", () => {
      expect(rangeLimit(5, true, 10)).toBe(5);
    });

    it("wraps with custom min using two-arg form", () => {
      expect(rangeLimit(1, true, 2, 8)).toBe(8);
      expect(rangeLimit(9, true, 2, 8)).toBe(2);
    });
  });

  it("throws when called with no range args", () => {
    // @ts-expect-error testing invalid call
    expect(() => rangeLimit(5, false)).toThrow("Invalid number of parameters");
  });
});
