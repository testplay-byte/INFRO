/**
 * Tasteful, warm palette for match groups. Cycles through amber, sage,
 * copper and muted rose — no indigo/blue, consistent with the espresso
 * theme. Used by the timeline and match list to link corresponding
 * regions across Video A / Video B.
 */

export const MATCH_PALETTE: { base: string; soft: string }[] = [
  { base: "oklch(0.82 0.15 68)", soft: "oklch(0.82 0.15 68 / 0.30)" }, // amber
  { base: "oklch(0.78 0.12 145)", soft: "oklch(0.78 0.12 145 / 0.30)" }, // sage
  { base: "oklch(0.74 0.17 52)", soft: "oklch(0.74 0.17 52 / 0.30)" }, // copper
  { base: "oklch(0.74 0.13 25)", soft: "oklch(0.74 0.13 25 / 0.30)" }, // rose
  { base: "oklch(0.78 0.13 95)", soft: "oklch(0.78 0.13 95 / 0.30)" }, // gold
  { base: "oklch(0.74 0.11 165)", soft: "oklch(0.74 0.11 165 / 0.30)" }, // teal-sage
];

/** A stable group index derived from a match id / group bucket. */
export function groupColorIndex(group: number): number {
  return ((group % MATCH_PALETTE.length) + MATCH_PALETTE.length) %
    MATCH_PALETTE.length;
}

export function groupColor(group: number) {
  return MATCH_PALETTE[groupColorIndex(group)];
}
