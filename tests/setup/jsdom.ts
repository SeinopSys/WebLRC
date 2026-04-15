// This file runs for ALL test environments but only applies DOM-specific setup
// when actually running in a jsdom environment.
if (typeof document !== "undefined") {
  const { vi } = await import("vitest");
  const { default: $ } = await import("jquery");

  // Make jQuery available globally — mirrors what a browser <script> tag would do.
  // Some utilities (e.g. translatePlaceholders) reference $.each without an explicit import.
  (globalThis as unknown as Record<string, unknown>).$ = $;
  (globalThis as unknown as Record<string, unknown>).jQuery = $;

  // jsdom does not implement URL.createObjectURL / revokeObjectURL
  Object.defineProperty(globalThis.URL, "createObjectURL", {
    value: vi.fn().mockReturnValue("blob:mock-url"),
    writable: true,
  });
  Object.defineProperty(globalThis.URL, "revokeObjectURL", {
    value: vi.fn(),
    writable: true,
  });

  // jsdom provides HTMLMediaElement but play/pause/load throw "not implemented"
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    value: vi.fn().mockResolvedValue(undefined),
    writable: true,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    value: vi.fn(),
    writable: true,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    value: vi.fn(),
    writable: true,
  });
}
