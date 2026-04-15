import { describe, it, expect } from "vitest";
import { Duration } from "../../src/lrc/Duration";

describe("Duration", () => {
  describe("constructor with number", () => {
    it("creates a valid Duration from a positive integer", () => {
      const d = new Duration(90);
      expect(d.valid).toBe(true);
      expect(d.seconds).toBe(90);
    });

    it("creates a valid Duration from a float, rounded to 3 decimal places", () => {
      const d = new Duration(1.23456789);
      expect(d.valid).toBe(true);
      expect(d.seconds).toBe(1.235);
    });

    it("clamps negative values to 0", () => {
      const d = new Duration(-5);
      expect(d.valid).toBe(true);
      expect(d.seconds).toBe(0);
    });

    it("produces NaN seconds and invalid for NaN input", () => {
      const d = new Duration(NaN);
      expect(d.valid).toBe(false);
      expect(Number.isNaN(d.seconds)).toBe(true);
    });

    it("produces NaN seconds and invalid for Infinity input", () => {
      const d = new Duration(Infinity);
      expect(d.valid).toBe(false);
      expect(Number.isNaN(d.seconds)).toBe(true);
    });

    it("handles zero correctly", () => {
      const d = new Duration(0);
      expect(d.valid).toBe(true);
      expect(d.seconds).toBe(0);
    });

    it("uses Math.ceil when ignoreMs=true", () => {
      const d = new Duration(1.2, true);
      expect(d.valid).toBe(true);
      expect(d.seconds).toBe(2);
    });

    it("ignoreMs=true leaves whole numbers unchanged", () => {
      const d = new Duration(3, true);
      expect(d.seconds).toBe(3);
    });
  });

  describe("constructor with null", () => {
    it("returns an invalid Duration", () => {
      const d = new Duration(null);
      expect(d.valid).toBe(false);
    });
  });

  describe("constructor with string", () => {
    it("parses MM:SS format", () => {
      const d = new Duration("1:23");
      expect(d.valid).toBe(true);
      expect(d.seconds).toBe(83);
    });

    it("parses MM:SS.mmm format", () => {
      const d = new Duration("1:23.456");
      expect(d.valid).toBe(true);
      expect(d.seconds).toBe(83.456);
    });

    it("parses H:MM:SS format", () => {
      const d = new Duration("1:23:45");
      expect(d.valid).toBe(true);
      expect(d.seconds).toBe(5025);
    });

    it("parses H:MM:SS.mmm format", () => {
      const d = new Duration("1:23:45.678");
      expect(d.valid).toBe(true);
      expect(d.seconds).toBeCloseTo(5025.678, 3);
    });

    it("parses raw float string below 60", () => {
      const d = new Duration("45.5");
      expect(d.valid).toBe(true);
      expect(d.seconds).toBe(45.5);
    });

    it("is invalid for raw float >= 60", () => {
      const d = new Duration("60");
      expect(d.valid).toBe(false);
    });

    it("is invalid for raw float exactly 60", () => {
      const d = new Duration("60.0");
      expect(d.valid).toBe(false);
    });

    it("is invalid for empty string", () => {
      const d = new Duration("");
      expect(d.valid).toBe(false);
    });

    it("is invalid for null", () => {
      const d = new Duration(null);
      expect(d.valid).toBe(false);
    });

    it("is invalid for non-numeric garbage", () => {
      const d = new Duration("abc");
      expect(d.valid).toBe(false);
    });

    it("handles 0:00 correctly", () => {
      const d = new Duration("0:00");
      expect(d.valid).toBe(true);
      expect(d.seconds).toBe(0);
    });

    it("handles 0:00.000 correctly", () => {
      const d = new Duration("0:00.000");
      expect(d.valid).toBe(true);
      expect(d.seconds).toBe(0);
    });
  });

  describe("isValid", () => {
    it("returns true for 0:00", () =>
      expect(Duration.isValid("0:00")).toBe(true));
    it("returns true for 1:23.456", () =>
      expect(Duration.isValid("1:23.456")).toBe(true));
    it("returns true for 59:59.999", () =>
      expect(Duration.isValid("59:59.999")).toBe(true));
    it("returns true for 1:23:45.678", () =>
      expect(Duration.isValid("1:23:45.678")).toBe(true));
    it("returns true for raw float 45.5 (< 60)", () =>
      expect(Duration.isValid("45.5")).toBe(true));
    it("returns true for raw integer 0", () =>
      expect(Duration.isValid("0")).toBe(true));
    it("returns false for null", () =>
      expect(Duration.isValid(null)).toBe(false));
    it("returns false for 60 (raw number >= 60)", () =>
      expect(Duration.isValid("60")).toBe(false));
    it("returns false for abc", () =>
      expect(Duration.isValid("abc")).toBe(false));
    it("returns false for :23 (missing minutes)", () =>
      expect(Duration.isValid(":23")).toBe(false));
    // Note: parseFloat("1:60") = 1.0 which is < 60, so isValid returns true via the fallback path
    it("returns true for 1:60 (parseFloat fallback reads '1' which is < 60)", () =>
      expect(Duration.isValid("1:60")).toBe(true));
  });

  describe("toString", () => {
    it("returns empty string for an invalid Duration", () => {
      expect(new Duration(null).toString()).toBe("");
    });

    it("formats sub-minute seconds as 0:SS.mmm", () => {
      expect(new Duration(5.123).toString()).toBe("0:05.123");
    });

    it("formats 90 seconds as 1:30.000", () => {
      expect(new Duration(90).toString()).toBe("1:30.000");
    });

    it("formats seconds >= 3600 with an hour component", () => {
      expect(new Duration(3661).toString()).toBe("1:01:01.000");
    });

    it("pads minutes when padMinutes=true", () => {
      expect(new Duration(65).toString(true)).toBe("01:05.000");
    });

    it("does not pad minutes when padMinutes=false (default)", () => {
      expect(new Duration(65).toString()).toBe("1:05.000");
    });

    it("omits milliseconds when ignoreMs=true (uses Math.ceil)", () => {
      // Math.ceil(90.5) = 91 → 1 minute 31 seconds
      expect(new Duration(90.5, true).toString()).toBe("1:31");
    });

    it("handles exactly 0 seconds", () => {
      expect(new Duration(0).toString()).toBe("0:00.000");
    });

    it("handles boundary at 59.999 seconds", () => {
      expect(new Duration(59.999).toString()).toBe("0:59.999");
    });
  });
});
