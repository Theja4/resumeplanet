import type { Lines, TextItem } from "../../types";
import { BULLET_CHARS } from "@/lib/parsers/utils";

/**
 * Re-export the shared bullet character list so existing imports
 * (e.g. group-text-items-into-lines.ts) continue to work.
 */
export const BULLET_POINTS = BULLET_CHARS;

/**
 * Convert bullet point lines into a string array aka descriptions.
 */
export const getBulletPointsFromLines = (lines: Lines): string[] => {
  // Simply return all lines with text item joined together if there is no bullet point
  const firstBulletPointLineIndex = getFirstBulletPointLineIdx(lines);
  if (firstBulletPointLineIndex === undefined) {
    return lines.map((line) => line.map((item) => item.text).join(" "));
  }

  // Otherwise, process and remove bullet points

  // Combine all lines into a single string
  let lineStr = "";
  for (const item of lines.flat()) {
    const text = item.text;
    // Make sure a space is added between 2 words
    if (!lineStr.endsWith(" ") && !text.startsWith(" ")) {
      lineStr += " ";
    }
    lineStr += text;
  }

  // Get the most common bullet point
  const commonBulletPoint = getMostCommonBulletPoint(lineStr);

  // Start line string from the beginning of the first bullet point
  const firstBulletPointIndex = lineStr.indexOf(commonBulletPoint);
  if (firstBulletPointIndex !== -1) {
    lineStr = lineStr.slice(firstBulletPointIndex);
  }

  // Divide the single string using bullet point as divider
  return lineStr
    .split(commonBulletPoint)
    .map((text) => text.trim())
    .filter((text) => !!text);
};

const getMostCommonBulletPoint = (str: string): string => {
  const bulletToCount: { [bullet: string]: number } = BULLET_POINTS.reduce(
    (acc: { [bullet: string]: number }, cur) => {
      acc[cur] = 0;
      return acc;
    },
    {}
  );
  let bulletWithMostCount = BULLET_POINTS[0];
  let bulletMaxCount = 0;
  for (const char of str) {
    if (bulletToCount.hasOwnProperty(char)) {
      bulletToCount[char]++;
      if (bulletToCount[char] > bulletMaxCount) {
        bulletWithMostCount = char;
        bulletMaxCount = bulletToCount[char];
      }
    }
  }
  return bulletWithMostCount;
};

const getFirstBulletPointLineIdx = (lines: Lines): number | undefined => {
  for (let i = 0; i < lines.length; i++) {
    for (const item of lines[i]) {
      if (BULLET_POINTS.some((bullet) => item.text.includes(bullet))) {
        return i;
      }
    }
  }
  return undefined;
};

// Only consider words that don't contain numbers
const isWord = (str: string) => /^[^0-9]+$/.test(str);
const hasAtLeast8Words = (item: TextItem) =>
  item.text.split(/\s/).filter(isWord).length >= 8;

export const getDescriptionsLineIdx = (lines: Lines): number | undefined => {
  // The main heuristic to determine descriptions is to check if has bullet point
  let idx = getFirstBulletPointLineIdx(lines);

  // Fallback heuristic if the main heuristic doesn't apply (e.g. LinkedIn resume) to
  // check if the line has at least 8 words
  if (idx === undefined) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length === 1 && hasAtLeast8Words(line[0])) {
        idx = i;
        break;
      }
    }
  }

  return idx;
};
