/**
 * Tasteful, warm palette for match groups. Cycles through amber, sage,
 * copper and muted rose — no indigo/blue, consistent with the espresso
 * theme. Used by the timeline and match list to link corresponding
 * regions across Video A / Video B.
 */

export const MATCH_PALETTE: { base: string; soft: string }[] = [
  { base: "oklch(0.78 0.13 70)", soft: "oklch(0.78 0.13 70 / 0.28)" }, // amber
  { base: "oklch(0.74 0.1 145)", soft: "oklch(0.74 0.1 145 / 0.28)" }, // sage
  { base: "oklch(0.7 0.15 52)", soft: "oklch(0.7 0.15 52 / 0.28)" }, // copper
  { base: "oklch(0.72 0.11 25)", soft: "oklch(0.72 0.11 25 / 0.28)" }, // rose
  { base: "oklch(0.75 0.11 95)", soft: "oklch(0.75 0.11 95 / 0.28)" }, // gold
  { base: "oklch(0.7 0.09 165)", soft: "oklch(0.7 0.09 165 / 0.28)" }, // teal-sage
];

/** A stable group index derived from a match id / group bucket. */
export function groupColorIndex(group: number): number {
  return ((group % MATCH_PALETTE.length) + MATCH_PALETTE.length) %
    MATCH_PALETTE.length;
}

export function groupColor(group: number) {
  return MATCH_PALETTE[groupColorIndex(group)];
}
