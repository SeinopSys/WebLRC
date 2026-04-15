import { LRCString, LRCStringJsonValue } from "./LRCString";

export interface ValidBackupData {
  metadata: Record<string, unknown>;
  timings: LRCStringJsonValue[];
}

/**
 * Safely parses a JSON string into an object.
 * Returns null if the input is not a non-empty string or JSON is malformed.
 */
export function parseBackupJson(data: unknown): unknown | null {
  if (typeof data === "string" && data.trim().length > 0) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return null;
}

/**
 * Type guard that validates a parsed backup object has the expected shape.
 */
export function isValidBackupData(data: unknown): data is ValidBackupData {
  return (
    typeof data === "object" &&
    data !== null &&
    "metadata" in data &&
    typeof data.metadata === "object" &&
    data.metadata !== null &&
    "timings" in data &&
    Array.isArray(data.timings) &&
    data.timings.every((item) => LRCString.isValidJsonData(item))
  );
}
