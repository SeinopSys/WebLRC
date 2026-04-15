import { describe, it, expect } from "vitest";
import {
  Key,
  isKey,
  isShiftKeyPressed,
  isCtrlKeyPressed,
} from "../../src/utils/Key";

describe("Key enum", () => {
  it("Enter equals 13", () => expect(Key.Enter).toBe(13));
  it("Esc equals 27", () => expect(Key.Esc).toBe(27));
  it("Space equals 32", () => expect(Key.Space).toBe(32));
  it("PageUp equals 33", () => expect(Key.PageUp).toBe(33));
  it("PageDown equals 34", () => expect(Key.PageDown).toBe(34));
  it("LeftArrow equals 37", () => expect(Key.LeftArrow).toBe(37));
  it("UpArrow equals 38", () => expect(Key.UpArrow).toBe(38));
  it("RightArrow equals 39", () => expect(Key.RightArrow).toBe(39));
  it("DownArrow equals 40", () => expect(Key.DownArrow).toBe(40));
  it("Delete equals 46", () => expect(Key.Delete).toBe(46));
  it("Backspace equals 8", () => expect(Key.Backspace).toBe(8));
  it("Tab equals 9", () => expect(Key.Tab).toBe(9));
  it("Comma equals 188", () => expect(Key.Comma).toBe(188));
  it("Period equals 190", () => expect(Key.Period).toBe(190));
});

describe("isKey", () => {
  it("returns true when keyCode matches the Key enum value", () => {
    expect(isKey(Key.Enter, { keyCode: 13 })).toBe(true);
  });

  it("returns false when keyCode does not match", () => {
    expect(isKey(Key.Enter, { keyCode: 27 })).toBe(false);
  });

  it("works for Space key", () => {
    expect(isKey(Key.Space, { keyCode: 32 })).toBe(true);
  });

  it("works for LeftArrow key", () => {
    expect(isKey(Key.LeftArrow, { keyCode: 37 })).toBe(true);
  });
});

describe("isShiftKeyPressed", () => {
  const makeEvent = (shiftKey: boolean, ctrlKey: boolean, altKey: boolean) =>
    ({ shiftKey, ctrlKey, altKey }) as unknown as JQuery.Event;

  it("returns true when only shiftKey is pressed", () => {
    expect(isShiftKeyPressed(makeEvent(true, false, false))).toBe(true);
  });

  it("returns false when shiftKey and ctrlKey are both pressed", () => {
    expect(isShiftKeyPressed(makeEvent(true, true, false))).toBe(false);
  });

  it("returns false when shiftKey and altKey are both pressed", () => {
    expect(isShiftKeyPressed(makeEvent(true, false, true))).toBe(false);
  });

  it("returns false when shiftKey is not pressed", () => {
    expect(isShiftKeyPressed(makeEvent(false, false, false))).toBe(false);
  });
});

describe("isCtrlKeyPressed", () => {
  const makeEvent = (shiftKey: boolean, ctrlKey: boolean, altKey: boolean) =>
    ({ shiftKey, ctrlKey, altKey }) as unknown as JQuery.Event;

  it("returns true when only ctrlKey is pressed", () => {
    expect(isCtrlKeyPressed(makeEvent(false, true, false))).toBe(true);
  });

  it("returns false when ctrlKey and shiftKey are both pressed", () => {
    expect(isCtrlKeyPressed(makeEvent(true, true, false))).toBe(false);
  });

  it("returns false when ctrlKey and altKey are both pressed", () => {
    expect(isCtrlKeyPressed(makeEvent(false, true, true))).toBe(false);
  });

  it("returns false when ctrlKey is not pressed", () => {
    expect(isCtrlKeyPressed(makeEvent(false, false, false))).toBe(false);
  });
});
