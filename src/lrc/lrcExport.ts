import { LRCString } from "./LRCString";

/**
 * Builds the text content of an LRC file from timings and metadata.
 *
 * @param timings - The timing entries to export
 * @param metadata - Combined metadata record (initialMetadata merged with user metadata)
 * @param merged - When true, identical lyric strings share a single line with multiple timestamps
 * @param includeMetadata - When false, metadata header lines are omitted
 */
export function buildLrcOutput(
  timings: LRCString[],
  metadata: Record<string, string>,
  merged: boolean,
  includeMetadata = true,
): string {
  let outputArr: string[] = [];

  if (includeMetadata) {
    Object.entries(metadata).forEach(([k, v]) => {
      let value = v;
      if (value !== "") {
        switch (k) {
          case "offset":
            if (value === "0") return;
            break;
          case "length":
            value = ` ${value}`;
            break;
        }
        outputArr.push(`[${k}:${value}]`);
      }
    });
  }

  if (merged) {
    const strings: Record<string, string[]> = {};
    timings.forEach((el) => {
      if (typeof strings[el.str] === "undefined") strings[el.str] = [];
      strings[el.str].push(el.ts.toString(true));
    });
    Object.entries(strings).forEach(([str, tsArr]) => {
      outputArr.push(`[${tsArr.join("][")}]${str}`);
    });
  } else {
    outputArr = [
      ...outputArr,
      ...timings.map((el) => `[${el.ts.toString(true)}]${el.str}`),
    ];
  }

  return `${outputArr.join("\n")}\n`;
}
